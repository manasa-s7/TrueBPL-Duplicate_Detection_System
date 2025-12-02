export interface Beneficiary {
  id: string;
  card_number: string;
  name: string;
  phone?: string;
  address?: string;
  face_image_url?: string;
  status: 'active' | 'suspended' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface RationShop {
  id: string;
  shop_code: string;
  name: string;
  location: string;
  district: string;
  state: string;
  operator_name?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  beneficiary_id: string;
  card_number: string;
  shop_id: string;
  cycle_id?: string;
  verification_type: 'face' | 'manual' | 'override';
  face_match_confidence?: number;
  captured_image_url?: string;
  status: 'success' | 'failed' | 'flagged' | 'pending';
  items_collected: any[];
  operator_id?: string;
  notes?: string;
  created_at: string;
  beneficiaries?: Beneficiary;
  ration_shops?: RationShop;
}

export interface DuplicateAlert {
  id: string;
  alert_type: 'duplicate_location' | 'different_person' | 'multiple_attempts' | 'suspicious_timing';
  beneficiary_id?: string;
  card_number: string;
  transaction_id?: string;
  previous_transaction_id?: string;
  shop_id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  beneficiaries?: Beneficiary;
  ration_shops?: RationShop;
}

export interface DashboardStats {
  total_beneficiaries: number;
  active_beneficiaries: number;
  total_transactions: number;
  flagged_transactions: number;
  pending_alerts: number;
  critical_alerts: number;
}

export interface VerificationRequest {
  card_number: string;
  shop_id: string;
  captured_image_base64: string;
  operator_id: string;
  items_collected?: any[];
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  transaction_id?: string;
  beneficiary?: Beneficiary;
  confidence?: number;
  alerts?: any[];
}
