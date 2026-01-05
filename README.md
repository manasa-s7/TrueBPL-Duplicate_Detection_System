# BPL Card Duplicate Detection System

A complete real-time web application that detects duplicate BPL card usage using face recognition and cloud-based verification. This system prevents a single BPL card holder from collecting rations from multiple locations by enforcing identity authentication at every ration shop.

## Features

- **Face Recognition**: Advanced AI-powered facial recognition using DeepFace and OpenCV
- **Real-Time Verification**: Instant identity verification at ration distribution centers
- **Duplicate Detection**: Automatic detection of:
  - Same person attempting collection at multiple locations
  - Different person using the same BPL card
  - Multiple collection attempts within the same distribution cycle
  - Suspicious timing patterns
- **Admin Dashboard**: Complete beneficiary registration and management system
- **Operator Interface**: Simple verification interface for ration shop operators
- **Monitoring System**: Real-time tracking of transactions and alerts
- **Cloud Sync**: Centralized Supabase database for multi-location synchronization

## Tech Stack

### Backend
- **Python 3.9+**
- **FastAPI**: Modern web framework for API development
- **DeepFace**: Face recognition library with FaceNet512 model
- **OpenCV**: Image processing and face detection
- **Supabase Python Client**: Database connectivity

### Frontend
- **React 18** with TypeScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Supabase JS Client**: Real-time database operations

### Database
- **Supabase/PostgreSQL**: Cloud-hosted database with Row Level Security

## Project Structure

```
project/
├── backend/
│   ├── main.py                      # FastAPI application with all endpoints
│   ├── face_recognition_service.py  # Face recognition logic
│   ├── duplicate_detection.py       # Duplicate detection algorithms
│   ├── database.py                  # Supabase client setup
│   ├── config.py                    # Configuration settings
│   ├── models.py                    # Pydantic models
│   ├── requirements.txt             # Python dependencies
│   └── .env                         # Environment variables
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx       # Admin interface
│   │   ├── BeneficiaryRegistration.tsx  # Registration form
│   │   ├── BeneficiaryList.tsx      # List of all beneficiaries
│   │   ├── OperatorDashboard.tsx    # Operator verification interface
│   │   └── MonitoringDashboard.tsx  # Real-time monitoring
│   ├── lib/
│   │   └── supabase.ts              # Supabase client
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   ├── App.tsx                      # Main application with routing
│   └── main.tsx                     # Application entry point
└── README.md
```
live : https://real-time-bpl-duplic-7q85.bolt.host/

## Database Schema

### Tables

1. **beneficiaries**: BPL card holder information and face embeddings
2. **ration_shops**: Ration distribution center details
3. **transactions**: Log of all verification attempts
4. **duplicate_alerts**: Flagged duplicate/fraudulent attempts
5. **distribution_cycles**: Monthly/periodic distribution cycles

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Supabase account (already configured)

### Step 1: Clone and Install Frontend Dependencies

```bash
# Install frontend dependencies
npm install
```

### Step 2: Setup Python Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 3: Environment Variables

The `.env` file in the backend directory is already configured with Supabase credentials. For production, update these values:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### Step 4: Database Setup

The database schema has already been created via migration. The following tables exist:
- beneficiaries
- ration_shops (with 3 sample shops)
- transactions
- duplicate_alerts
- distribution_cycles (with active December 2025 cycle)

## Running the Application

### Start Backend Server

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```

Backend will run on: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Start Frontend Development Server

```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

## Usage Guide

### 1. Admin Dashboard

**Register New Beneficiaries:**
1. Navigate to Admin Dashboard
2. Click "Register Beneficiary"
3. Fill in:
   - BPL Card Number (required)
   - Full Name (required)
   - Phone (optional)
   - Address (optional)
4. Capture or upload face image
5. Click "Register Beneficiary"

**View All Beneficiaries:**
- Click "All Beneficiaries" tab
- Search by name or card number
- View registration details and status

### 2. Ration Shop Operator

**Verify Beneficiary:**
1. Navigate to Ration Shop Operator
2. Select your ration shop
3. Enter BPL card number
4. Capture beneficiary's face using camera or upload image
5. Click "Verify Beneficiary"

**Verification Results:**
- **Success (Green)**: Face matches, no duplicates detected
- **Warning (Yellow)**: Face matches but duplicate alerts detected
- **Failed (Red)**: Face doesn't match or card not found

### 3. Real-Time Monitoring

**Track Transactions:**
- View recent verification attempts
- See success/failed/flagged status
- Check face match confidence scores

**Manage Alerts:**
- View all duplicate detection alerts
- Review alert severity (low/medium/high/critical)
- Resolve or dismiss alerts
- Track alert status

## API Endpoints

### Beneficiary Management
- `POST /api/beneficiaries` - Register new beneficiary
- `GET /api/beneficiaries` - Get all beneficiaries
- `GET /api/beneficiaries/{card_number}` - Get by card number

### Verification
- `POST /api/verify` - Verify beneficiary with face recognition

### Transactions & Alerts
- `GET /api/transactions` - Get transaction history
- `GET /api/alerts` - Get duplicate alerts
- `PUT /api/alerts/{alert_id}/review` - Review alert

### Utility
- `GET /api/shops` - Get all ration shops
- `GET /api/dashboard/stats` - Get dashboard statistics

## Duplicate Detection Logic

The system checks for:

1. **Different Person, Same Card**: Card used by someone other than registered beneficiary
2. **Duplicate Location**: Same beneficiary collecting from multiple shops in one cycle
3. **Multiple Attempts**: More than one successful transaction per cycle
4. **Suspicious Timing**: Multiple transactions within short time window (configurable)

## Configuration

Edit `backend/config.py` to adjust:

```python
FACE_MATCH_THRESHOLD = 0.6  # Minimum confidence for face match
DUPLICATE_TIME_WINDOW_HOURS = 24  # Time window for suspicious timing
MAX_TRANSACTIONS_PER_CYCLE = 1  # Max collections per cycle
```

## Testing

### Sample Test Flow

1. **Register Test Beneficiary:**
   - Card: TEST001
   - Name: Test User
   - Upload test face image

2. **Successful Verification:**
   - Use same card number and face image
   - Should succeed with high confidence

3. **Duplicate Detection Test:**
   - Try verifying again at different shop
   - Should flag duplicate location alert

4. **Wrong Person Test:**
   - Use same card with different face
   - Should fail verification

## Troubleshooting

### Backend Issues

**Import Errors:**
```bash
pip install --upgrade -r requirements.txt
```

**Camera Access Denied:**
- Check browser permissions
- Ensure HTTPS or localhost

**Face Detection Fails:**
- Ensure good lighting
- Face should be clearly visible
- Try different image quality

### Frontend Issues

**Supabase Connection Error:**
- Verify environment variables in `.env`
- Check Supabase project status

**API Connection Failed:**
- Ensure backend is running on port 8000
- Check CORS settings in backend

## Security Features

- Row Level Security (RLS) on all database tables
- Secure face embedding storage
- Authentication-based API access
- CORS protection
- Input validation and sanitization

## Production Deployment

### Backend Deployment
- Use gunicorn or uvicorn with workers
- Set up SSL certificates
- Configure proper CORS origins
- Use production-grade database credentials

### Frontend Deployment
- Build: `npm run build`
- Deploy dist folder to hosting service
- Update API_BASE_URL in OperatorDashboard.tsx

## Future Enhancements

- SMS notifications for alerts
- Biometric fingerprint integration
- Mobile app for operators
- Advanced analytics dashboard
- Batch import of beneficiaries
- Multi-language support
- Voice-guided verification

## Support

For issues or questions:
1. Check API documentation at `/docs`
2. Review database schema in migrations
3. Verify environment variables
4. Check browser console for errors

## License

This project is developed for educational and demonstration purposes.
