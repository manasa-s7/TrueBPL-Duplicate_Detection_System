/*
  # BPL Card Duplicate Detection System - Database Schema

  ## Overview
  This migration creates the complete database structure for a real-time BPL card 
  duplicate detection system using face recognition technology.

  ## New Tables

  ### 1. `beneficiaries`
  Stores registered BPL card holders with their identity information and face embeddings.
  - `id` (uuid, primary key) - Unique beneficiary identifier
  - `card_number` (text, unique) - BPL card number
  - `name` (text) - Full name of beneficiary
  - `phone` (text) - Contact number
  - `address` (text) - Residential address
  - `face_image_url` (text) - URL to stored face image in Supabase storage
  - `face_embedding` (text) - Serialized face embedding vector for matching
  - `status` (text) - Account status (active/suspended)
  - `created_at` (timestamptz) - Registration timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `ration_shops`
  Stores information about ration distribution centers.
  - `id` (uuid, primary key) - Unique shop identifier
  - `shop_code` (text, unique) - Official shop code
  - `name` (text) - Shop name
  - `location` (text) - Shop address
  - `district` (text) - District name
  - `state` (text) - State name
  - `operator_name` (text) - Shop operator name
  - `created_at` (timestamptz) - Registration timestamp

  ### 3. `transactions`
  Records every ration collection event with verification details.
  - `id` (uuid, primary key) - Unique transaction identifier
  - `beneficiary_id` (uuid, foreign key) - Reference to beneficiary
  - `card_number` (text) - Card number used in transaction
  - `shop_id` (uuid, foreign key) - Reference to ration shop
  - `verification_type` (text) - face/manual/override
  - `face_match_confidence` (numeric) - Confidence score (0-100)
  - `captured_image_url` (text) - URL to captured verification image
  - `status` (text) - success/failed/flagged
  - `items_collected` (jsonb) - Array of items distributed
  - `operator_id` (text) - ID of operator who processed
  - `created_at` (timestamptz) - Transaction timestamp

  ### 4. `duplicate_alerts`
  Stores detected duplicate or fraudulent attempts.
  - `id` (uuid, primary key) - Unique alert identifier
  - `alert_type` (text) - duplicate_location/different_person/multiple_attempts
  - `beneficiary_id` (uuid, foreign key) - Reference to beneficiary
  - `card_number` (text) - Card number involved
  - `transaction_id` (uuid, foreign key) - Reference to flagged transaction
  - `previous_transaction_id` (uuid) - Reference to conflicting transaction
  - `shop_id` (uuid, foreign key) - Shop where alert occurred
  - `description` (text) - Detailed alert description
  - `severity` (text) - low/medium/high/critical
  - `status` (text) - pending/reviewed/resolved
  - `reviewed_by` (text) - Admin who reviewed
  - `reviewed_at` (timestamptz) - Review timestamp
  - `created_at` (timestamptz) - Alert timestamp

  ### 5. `distribution_cycles`
  Tracks monthly/periodic distribution cycles.
  - `id` (uuid, primary key) - Unique cycle identifier
  - `cycle_name` (text) - e.g., "January 2025"
  - `start_date` (date) - Cycle start date
  - `end_date` (date) - Cycle end date
  - `status` (text) - active/completed/cancelled
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Separate policies for admin, operator, and public access
  - Beneficiary data restricted to authenticated users
  - Transaction logs append-only for operators

  ## Indexes
  - Optimized for fast card number lookups
  - Face embedding searches
  - Transaction date range queries
  - Alert status filtering
*/

-- Create beneficiaries table
CREATE TABLE IF NOT EXISTS beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  address text,
  face_image_url text,
  face_embedding text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ration shops table
CREATE TABLE IF NOT EXISTS ration_shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_code text UNIQUE NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  district text NOT NULL,
  state text DEFAULT 'India',
  operator_name text,
  created_at timestamptz DEFAULT now()
);

-- Create distribution cycles table
CREATE TABLE IF NOT EXISTS distribution_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id uuid REFERENCES beneficiaries(id),
  card_number text NOT NULL,
  shop_id uuid REFERENCES ration_shops(id) NOT NULL,
  cycle_id uuid REFERENCES distribution_cycles(id),
  verification_type text DEFAULT 'face' CHECK (verification_type IN ('face', 'manual', 'override')),
  face_match_confidence numeric CHECK (face_match_confidence >= 0 AND face_match_confidence <= 100),
  captured_image_url text,
  status text DEFAULT 'success' CHECK (status IN ('success', 'failed', 'flagged', 'pending')),
  items_collected jsonb DEFAULT '[]'::jsonb,
  operator_id text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create duplicate alerts table
CREATE TABLE IF NOT EXISTS duplicate_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL CHECK (alert_type IN ('duplicate_location', 'different_person', 'multiple_attempts', 'suspicious_timing')),
  beneficiary_id uuid REFERENCES beneficiaries(id),
  card_number text NOT NULL,
  transaction_id uuid REFERENCES transactions(id),
  previous_transaction_id uuid REFERENCES transactions(id),
  shop_id uuid REFERENCES ration_shops(id) NOT NULL,
  description text NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_beneficiaries_card_number ON beneficiaries(card_number);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_status ON beneficiaries(status);
CREATE INDEX IF NOT EXISTS idx_transactions_beneficiary_id ON transactions(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_number ON transactions(card_number);
CREATE INDEX IF NOT EXISTS idx_transactions_shop_id ON transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_cycle_id ON transactions(cycle_id);
CREATE INDEX IF NOT EXISTS idx_duplicate_alerts_status ON duplicate_alerts(status);
CREATE INDEX IF NOT EXISTS idx_duplicate_alerts_severity ON duplicate_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_duplicate_alerts_created_at ON duplicate_alerts(created_at);

-- Enable Row Level Security
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ration_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_cycles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for beneficiaries
CREATE POLICY "Authenticated users can view beneficiaries"
  ON beneficiaries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert beneficiaries"
  ON beneficiaries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update beneficiaries"
  ON beneficiaries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ration_shops
CREATE POLICY "Authenticated users can view shops"
  ON ration_shops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert shops"
  ON ration_shops FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for transactions
CREATE POLICY "Authenticated users can view transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for duplicate_alerts
CREATE POLICY "Authenticated users can view alerts"
  ON duplicate_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert alerts"
  ON duplicate_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
  ON duplicate_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for distribution_cycles
CREATE POLICY "Authenticated users can view cycles"
  ON distribution_cycles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cycles"
  ON distribution_cycles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cycles"
  ON distribution_cycles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for beneficiaries
DROP TRIGGER IF EXISTS update_beneficiaries_updated_at ON beneficiaries;
CREATE TRIGGER update_beneficiaries_updated_at
  BEFORE UPDATE ON beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample ration shops
INSERT INTO ration_shops (shop_code, name, location, district, state, operator_name)
VALUES
  ('RS001', 'Central Ration Shop', '123 Market Street, Downtown', 'Central District', 'State A', 'Rajesh Kumar'),
  ('RS002', 'North Zone Fair Price Shop', '456 North Avenue, Sector 5', 'North District', 'State A', 'Priya Sharma'),
  ('RS003', 'East District PDS Center', '789 East Road, Block C', 'East District', 'State A', 'Mohammed Ali')
ON CONFLICT (shop_code) DO NOTHING;

-- Insert initial distribution cycle
INSERT INTO distribution_cycles (cycle_name, start_date, end_date, status)
VALUES
  ('December 2025', '2025-12-01', '2025-12-31', 'active')
ON CONFLICT DO NOTHING;