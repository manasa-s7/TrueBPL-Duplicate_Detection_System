# Backend - BPL Card Duplicate Detection System

Python FastAPI backend with face recognition and duplicate detection capabilities.

## Quick Start

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

Server runs on `http://localhost:8000`

API docs at `http://localhost:8000/docs`

## Environment Setup

Create `.env` file with:
```
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key
```

## API Endpoints

### Health Check
- `GET /` - Check API status

### Beneficiaries
- `POST /api/beneficiaries` - Register beneficiary
- `GET /api/beneficiaries` - List all beneficiaries
- `GET /api/beneficiaries/{card_number}` - Get specific beneficiary

### Verification
- `POST /api/verify` - Verify beneficiary with face recognition

### Monitoring
- `GET /api/transactions` - Get transaction history
- `GET /api/alerts` - Get duplicate alerts
- `PUT /api/alerts/{alert_id}/review` - Review alert

### Data
- `GET /api/shops` - Get ration shops
- `GET /api/dashboard/stats` - Get statistics

## Key Files

- `main.py` - FastAPI application
- `face_recognition_service.py` - Face recognition logic
- `duplicate_detection.py` - Duplicate detection algorithms
- `database.py` - Supabase client
- `models.py` - Pydantic models
- `config.py` - Configuration

## Dependencies

- FastAPI - Web framework
- DeepFace - Face recognition
- OpenCV - Image processing
- Supabase - Database client
- TensorFlow - ML backend for DeepFace

## Testing

```bash
# Test API
curl http://localhost:8000/

# Interactive docs
open http://localhost:8000/docs
```
