from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import base64
from datetime import datetime
import json

from models import (
    BeneficiaryCreate,
    BeneficiaryResponse,
    VerificationRequest,
    VerificationResponse,
    TransactionResponse,
    DuplicateAlertResponse
)
from database import get_supabase_client
from face_recognition_service import face_service
from duplicate_detection import duplicate_service
from config import FACE_MATCH_THRESHOLD

app = FastAPI(title="BPL Card Duplicate Detection System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = get_supabase_client()

@app.get("/")
def read_root():
    return {
        "message": "BPL Card Duplicate Detection System API",
        "version": "1.0.0",
        "status": "active"
    }

@app.post("/api/beneficiaries", response_model=dict)
async def register_beneficiary(beneficiary: BeneficiaryCreate):
    try:
        existing = supabase.table("beneficiaries").select("id").eq(
            "card_number", beneficiary.card_number
        ).execute()

        if existing.data:
            raise HTTPException(status_code=400, detail="Card number already registered")

        image_data = face_service.base64_to_bytes(beneficiary.face_image_base64)

        has_face = face_service.detect_face_in_image(image_data)
        if not has_face:
            raise HTTPException(status_code=400, detail="No face detected in image")

        face_embedding = face_service.extract_face_embedding(image_data)
        if not face_embedding:
            raise HTTPException(status_code=400, detail="Could not extract face features")

        beneficiary_data = {
            "card_number": beneficiary.card_number,
            "name": beneficiary.name,
            "phone": beneficiary.phone,
            "address": beneficiary.address,
            "face_image_url": beneficiary.face_image_base64[:100] + "...",
            "face_embedding": face_embedding,
            "status": "active"
        }

        response = supabase.table("beneficiaries").insert(beneficiary_data).execute()

        if response.data:
            return {
                "success": True,
                "message": "Beneficiary registered successfully",
                "beneficiary": response.data[0]
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to register beneficiary")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/beneficiaries", response_model=List[dict])
async def get_all_beneficiaries(status: Optional[str] = None, limit: int = 100):
    try:
        query = supabase.table("beneficiaries").select("*")

        if status:
            query = query.eq("status", status)

        response = query.order("created_at", desc=True).limit(limit).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/beneficiaries/{card_number}", response_model=dict)
async def get_beneficiary_by_card(card_number: str):
    try:
        response = supabase.table("beneficiaries").select("*").eq(
            "card_number", card_number
        ).maybeSingle().execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Beneficiary not found")

        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/verify", response_model=VerificationResponse)
async def verify_beneficiary(verification: VerificationRequest):
    try:
        beneficiary_response = supabase.table("beneficiaries").select("*").eq(
            "card_number", verification.card_number
        ).maybeSingle().execute()

        if not beneficiary_response.data:
            return VerificationResponse(
                success=False,
                message="Card number not found in system",
                alerts=[]
            )

        beneficiary = beneficiary_response.data

        if beneficiary["status"] != "active":
            return VerificationResponse(
                success=False,
                message=f"Beneficiary account is {beneficiary['status']}",
                beneficiary=beneficiary,
                alerts=[]
            )

        captured_image_data = face_service.base64_to_bytes(verification.captured_image_base64)

        is_match, confidence = face_service.verify_face_from_image(
            captured_image_data,
            beneficiary["face_embedding"]
        )

        if not is_match or confidence < (FACE_MATCH_THRESHOLD * 100):
            return VerificationResponse(
                success=False,
                message=f"Face verification failed. Confidence: {confidence}%",
                beneficiary=beneficiary,
                confidence=confidence,
                alerts=[{
                    "alert_type": "different_person",
                    "severity": "critical",
                    "description": "Face does not match registered beneficiary"
                }]
            )

        active_cycle = supabase.table("distribution_cycles").select("id").eq(
            "status", "active"
        ).maybeSingle().execute()

        cycle_id = active_cycle.data["id"] if active_cycle.data else None

        duplicate_alerts = duplicate_service.check_duplicate_attempts(
            beneficiary["id"],
            verification.card_number,
            verification.shop_id,
            cycle_id
        )

        transaction_data = {
            "beneficiary_id": beneficiary["id"],
            "card_number": verification.card_number,
            "shop_id": verification.shop_id,
            "cycle_id": cycle_id,
            "verification_type": "face",
            "face_match_confidence": confidence,
            "captured_image_url": verification.captured_image_base64[:100] + "...",
            "status": "flagged" if duplicate_alerts else "success",
            "items_collected": json.dumps(verification.items_collected),
            "operator_id": verification.operator_id
        }

        transaction_response = supabase.table("transactions").insert(transaction_data).execute()

        if duplicate_alerts and transaction_response.data:
            transaction_id = transaction_response.data[0]["id"]
            for alert in duplicate_alerts:
                duplicate_service.create_alert(
                    alert_type=alert["alert_type"],
                    beneficiary_id=beneficiary["id"],
                    card_number=verification.card_number,
                    transaction_id=transaction_id,
                    shop_id=verification.shop_id,
                    description=alert["description"],
                    severity=alert["severity"],
                    previous_transaction_id=alert.get("previous_transaction_id")
                )

        return VerificationResponse(
            success=True,
            message="Verification successful" if not duplicate_alerts else "Verification completed with alerts",
            transaction_id=transaction_response.data[0]["id"] if transaction_response.data else None,
            beneficiary=beneficiary,
            confidence=confidence,
            alerts=duplicate_alerts
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/transactions", response_model=List[dict])
async def get_transactions(
    shop_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
):
    try:
        query = supabase.table("transactions").select(
            "*, beneficiaries(name, card_number), ration_shops(name, shop_code)"
        )

        if shop_id:
            query = query.eq("shop_id", shop_id)
        if status:
            query = query.eq("status", status)

        response = query.order("created_at", desc=True).limit(limit).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/alerts", response_model=List[dict])
async def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100
):
    try:
        query = supabase.table("duplicate_alerts").select(
            "*, beneficiaries(name, card_number), ration_shops(name, shop_code)"
        )

        if status:
            query = query.eq("status", status)
        if severity:
            query = query.eq("severity", severity)

        response = query.order("created_at", desc=True).limit(limit).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/alerts/{alert_id}/review")
async def review_alert(alert_id: str, status: str, reviewed_by: str):
    try:
        update_data = {
            "status": status,
            "reviewed_by": reviewed_by,
            "reviewed_at": datetime.now().isoformat()
        }

        response = supabase.table("duplicate_alerts").update(update_data).eq(
            "id", alert_id
        ).execute()

        if response.data:
            return {"success": True, "message": "Alert reviewed successfully"}
        else:
            raise HTTPException(status_code=404, detail="Alert not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/shops", response_model=List[dict])
async def get_ration_shops():
    try:
        response = supabase.table("ration_shops").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    try:
        total_beneficiaries = supabase.table("beneficiaries").select(
            "id", count="exact"
        ).execute()

        active_beneficiaries = supabase.table("beneficiaries").select(
            "id", count="exact"
        ).eq("status", "active").execute()

        total_transactions = supabase.table("transactions").select(
            "id", count="exact"
        ).execute()

        flagged_transactions = supabase.table("transactions").select(
            "id", count="exact"
        ).eq("status", "flagged").execute()

        pending_alerts = supabase.table("duplicate_alerts").select(
            "id", count="exact"
        ).eq("status", "pending").execute()

        critical_alerts = supabase.table("duplicate_alerts").select(
            "id", count="exact"
        ).eq("severity", "critical").eq("status", "pending").execute()

        return {
            "total_beneficiaries": total_beneficiaries.count or 0,
            "active_beneficiaries": active_beneficiaries.count or 0,
            "total_transactions": total_transactions.count or 0,
            "flagged_transactions": flagged_transactions.count or 0,
            "pending_alerts": pending_alerts.count or 0,
            "critical_alerts": critical_alerts.count or 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
