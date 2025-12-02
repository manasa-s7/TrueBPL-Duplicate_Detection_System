from datetime import datetime, timedelta
from typing import List, Dict, Optional
from database import get_supabase_client
from config import DUPLICATE_TIME_WINDOW_HOURS

class DuplicateDetectionService:
    def __init__(self):
        self.supabase = get_supabase_client()

    def check_duplicate_attempts(
        self,
        beneficiary_id: str,
        card_number: str,
        shop_id: str,
        current_cycle_id: Optional[str] = None
    ) -> List[Dict]:
        alerts = []

        same_card_different_person = self._check_same_card_different_person(
            card_number, beneficiary_id
        )
        if same_card_different_person:
            alerts.append(same_card_different_person)

        duplicate_location = self._check_duplicate_location(
            beneficiary_id, shop_id, current_cycle_id
        )
        if duplicate_location:
            alerts.append(duplicate_location)

        multiple_attempts = self._check_multiple_attempts_same_cycle(
            beneficiary_id, current_cycle_id
        )
        if multiple_attempts:
            alerts.append(multiple_attempts)

        suspicious_timing = self._check_suspicious_timing(
            beneficiary_id, shop_id
        )
        if suspicious_timing:
            alerts.append(suspicious_timing)

        return alerts

    def _check_same_card_different_person(
        self, card_number: str, current_beneficiary_id: str
    ) -> Optional[Dict]:
        try:
            response = self.supabase.table("transactions").select(
                "id, beneficiary_id, created_at, shop_id"
            ).eq("card_number", card_number).order("created_at", desc=True).limit(5).execute()

            if response.data:
                for transaction in response.data:
                    if transaction["beneficiary_id"] != current_beneficiary_id:
                        return {
                            "alert_type": "different_person",
                            "description": f"Card {card_number} was used by a different person in previous transaction",
                            "severity": "critical",
                            "previous_transaction_id": transaction["id"]
                        }
            return None
        except Exception as e:
            print(f"Error checking same card different person: {str(e)}")
            return None

    def _check_duplicate_location(
        self, beneficiary_id: str, current_shop_id: str, cycle_id: Optional[str]
    ) -> Optional[Dict]:
        try:
            query = self.supabase.table("transactions").select(
                "id, shop_id, created_at"
            ).eq("beneficiary_id", beneficiary_id).eq("status", "success")

            if cycle_id:
                query = query.eq("cycle_id", cycle_id)

            response = query.order("created_at", desc=True).limit(10).execute()

            if response.data:
                for transaction in response.data:
                    if transaction["shop_id"] != current_shop_id:
                        return {
                            "alert_type": "duplicate_location",
                            "description": f"Beneficiary already collected rations from a different shop in this cycle",
                            "severity": "high",
                            "previous_transaction_id": transaction["id"]
                        }
            return None
        except Exception as e:
            print(f"Error checking duplicate location: {str(e)}")
            return None

    def _check_multiple_attempts_same_cycle(
        self, beneficiary_id: str, cycle_id: Optional[str]
    ) -> Optional[Dict]:
        try:
            query = self.supabase.table("transactions").select(
                "id, created_at"
            ).eq("beneficiary_id", beneficiary_id).eq("status", "success")

            if cycle_id:
                query = query.eq("cycle_id", cycle_id)

            response = query.execute()

            if response.data and len(response.data) > 1:
                return {
                    "alert_type": "multiple_attempts",
                    "description": f"Beneficiary has {len(response.data)} transactions in current cycle",
                    "severity": "high",
                    "previous_transaction_id": response.data[0]["id"]
                }
            return None
        except Exception as e:
            print(f"Error checking multiple attempts: {str(e)}")
            return None

    def _check_suspicious_timing(
        self, beneficiary_id: str, shop_id: str
    ) -> Optional[Dict]:
        try:
            time_window = datetime.now() - timedelta(hours=DUPLICATE_TIME_WINDOW_HOURS)

            response = self.supabase.table("transactions").select(
                "id, created_at, shop_id"
            ).eq("beneficiary_id", beneficiary_id).gte(
                "created_at", time_window.isoformat()
            ).execute()

            if response.data and len(response.data) > 0:
                for transaction in response.data:
                    trans_time = datetime.fromisoformat(transaction["created_at"].replace('Z', '+00:00'))
                    time_diff = datetime.now(trans_time.tzinfo) - trans_time
                    hours_diff = time_diff.total_seconds() / 3600

                    if hours_diff < 2:
                        return {
                            "alert_type": "suspicious_timing",
                            "description": f"Multiple transactions within {hours_diff:.1f} hours",
                            "severity": "medium",
                            "previous_transaction_id": transaction["id"]
                        }
            return None
        except Exception as e:
            print(f"Error checking suspicious timing: {str(e)}")
            return None

    def create_alert(
        self,
        alert_type: str,
        beneficiary_id: str,
        card_number: str,
        transaction_id: str,
        shop_id: str,
        description: str,
        severity: str,
        previous_transaction_id: Optional[str] = None
    ) -> Optional[str]:
        try:
            alert_data = {
                "alert_type": alert_type,
                "beneficiary_id": beneficiary_id,
                "card_number": card_number,
                "transaction_id": transaction_id,
                "shop_id": shop_id,
                "description": description,
                "severity": severity,
                "status": "pending"
            }

            if previous_transaction_id:
                alert_data["previous_transaction_id"] = previous_transaction_id

            response = self.supabase.table("duplicate_alerts").insert(alert_data).execute()

            if response.data:
                return response.data[0]["id"]
            return None
        except Exception as e:
            print(f"Error creating alert: {str(e)}")
            return None

duplicate_service = DuplicateDetectionService()
