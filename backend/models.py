from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BeneficiaryCreate(BaseModel):
    card_number: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    face_image_base64: str

class BeneficiaryResponse(BaseModel):
    id: str
    card_number: str
    name: str
    phone: Optional[str]
    address: Optional[str]
    face_image_url: Optional[str]
    status: str
    created_at: str

class VerificationRequest(BaseModel):
    card_number: str
    shop_id: str
    captured_image_base64: str
    operator_id: str
    items_collected: Optional[List[dict]] = []

class VerificationResponse(BaseModel):
    success: bool
    message: str
    transaction_id: Optional[str] = None
    beneficiary: Optional[dict] = None
    confidence: Optional[float] = None
    alerts: Optional[List[dict]] = []

class TransactionResponse(BaseModel):
    id: str
    beneficiary_id: str
    card_number: str
    shop_id: str
    verification_type: str
    face_match_confidence: Optional[float]
    status: str
    items_collected: list
    created_at: str

class DuplicateAlertResponse(BaseModel):
    id: str
    alert_type: str
    card_number: str
    description: str
    severity: str
    status: str
    created_at: str
