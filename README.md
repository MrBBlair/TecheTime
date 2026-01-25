# Tech eTime

A mobile-first, spacious, professional workforce time clock + payroll reporting app, branded as **Tech eTime** under the Tech ePhi platform.

## Features

- **Firebase Authentication & Firestore** - Secure, scalable backend
- **PIN-based Time Clock** - Workers clock in/out with 4-digit PINs
- **Kiosk Mode** - Full-screen PIN pad for shared devices
- **Multi-Location Support** - Manage time entries across locations
- **Payroll Reports** - Generate reports with date range filtering and CSV export
- **AI Insights** - Google Gemini integration for payroll analysis and anomaly detection
- **Postmark Email** - Welcome emails and notifications
- **Mobile-First Design** - Optimized for phones, tablets, and iPads
- **Interactive Inputs** - PIN pads, date pickers, searchable selects to minimize typing

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Email**: Postmark
- **AI**: Google Gemini / Google AI
- **Hosting**: Vercel (ready)

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI: `npm install -g firebase-tools`
- Firebase account (or use emulator for local dev)
- Google Cloud SDK (for Application Default Credentials - recommended)
- Postmark account (optional, for email)
- Google AI API key (optional, for AI features)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create `.env` files in both `apps/web` and `apps/api` with your Firebase credentials:

**apps/web/.env**
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
# Only set this to 'true' if you want to use Firebase emulators
# VITE_USE_EMULATOR=false
```

**apps/api/.env**

Choose one authentication method:

**Option 1: Application Default Credentials (Recommended)**
```env
PORT=3001
FIREBASE_PROJECT_ID=your-project-id
# No FIREBASE_SERVICE_ACCOUNT needed - uses ADC automatically
# Run: gcloud auth application-default login
# See: apps/api/src/scripts/setup-adc.md for setup instructions
USE_FIREBASE_EMULATOR=false
SESSION_SECRET=your-random-session-secret
POSTMARK_API_TOKEN=your-postmark-token (optional)
POSTMARK_FROM_EMAIL=noreply@yourdomain.com (optional)
GOOGLE_AI_API_KEY=your-google-ai-key (optional)
```

**Option 2: Service Account JSON Key**
```env
PORT=3001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
USE_FIREBASE_EMULATOR=false
SESSION_SECRET=your-random-session-secret
POSTMARK_API_TOKEN=your-postmark-token (optional)
POSTMARK_FROM_EMAIL=noreply@yourdomain.com (optional)
GOOGLE_AI_API_KEY=your-google-ai-key (optional)
```

**Setting up Application Default Credentials (ADC):**

If you can't create service account keys (blocked by organization policies), use ADC:

1. Install Google Cloud SDK: `brew install --cask google-cloud-sdk` (macOS) or see [setup guide](apps/api/src/scripts/setup-adc.md)
2. Authenticate: `gcloud auth application-default login`
3. Select your Google account with Firebase access
4. The app will automatically use ADC - no JSON keys needed!

See `apps/api/src/scripts/setup-adc.md` for detailed ADC setup instructions.

**Note**: The app uses your real Firebase project by default. Emulators are only used if you explicitly set `VITE_USE_EMULATOR=true` or `USE_FIREBASE_EMULATOR=true`.

### 2a. Firebase Authentication Setup

The API uses Firebase Admin SDK which requires authentication. You have two options:

#### Option 1: Application Default Credentials (Recommended)

Best for local development and when service account key creation is blocked:

```bash
# Install Google Cloud SDK (if not already installed)
brew install --cask google-cloud-sdk  # macOS
# Or download from: https://cloud.google.com/sdk/docs/install

# Authenticate with your Google account
gcloud auth application-default login

# Set your Firebase project (optional but recommended)
gcloud config set project your-project-id
```

The app will automatically detect and use ADC. No JSON keys needed!

See `apps/api/src/scripts/setup-adc.md` for detailed instructions.

#### Option 2: Service Account JSON Key

If your organization allows it and you prefer explicit credentials:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the JSON content to `FIREBASE_SERVICE_ACCOUNT` in `apps/api/.env`

See `apps/api/src/scripts/get-service-account.md` for detailed instructions.

### 3. (Optional) Start Firestore Emulator

Only needed if you want to use the Firestore emulator for local development:

```bash
npm run emulators:start
```

**Note**: The app uses Firebase Authentication and Firestore. Emulators are only used if you explicitly enable them.

### 4. Create Test Account

Create a test account with sample data:

```bash
npm run seed
```

This creates:
- Admin account: `admin@techetime.demo` / `demo1234`
- 5 test workers with PINs
- 2 sample locations
- Sample time entries

**Note:** Requires `apps/api/.env` with `FIREBASE_PROJECT_ID` and either:
- Application Default Credentials (ADC) set up via `gcloud auth application-default login`, OR
- `FIREBASE_SERVICE_ACCOUNT` environment variable set

See `apps/api/src/scripts/setup-adc.md` for ADC setup or `apps/api/src/scripts/get-service-account.md` for service account setup.

### 5. Start Development Servers

```bash
npm run dev
```

This starts:
- Web app on http://localhost:5173
- API server on http://localhost:3001

## Demo Credentials

After seeding:

**Admin Login:**
- Email: `admin@techetime.demo`
- Password: `demo1234`

**Worker PINs:**
- John Doe: `1234`
- Jane Smith: `5678`
- Bob Johnson: `9012`
- Alice Williams: `3456`
- Charlie Brown: `7890`

## Project Structure

```
/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Node.js API
├── packages/
│   └── shared/       # Shared types and Zod schemas
├── firebase.json     # Firebase emulator config
└── package.json      # Root workspace
```

## Available Scripts

- `npm run dev` - Start web + API concurrently
- `npm run emulators:start` - Start Firebase emulators
- `npm run seed` - Seed Firestore with demo data
- `npm run build` - Build for production
- `npm run test` - Run tests

## API Endpoints

### Authentication
- `POST /api/auth/register-business` - Create business
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/locations` - List locations
- `POST /api/admin/locations` - Create location
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `POST /api/admin/users/:id/pin/reset` - Reset worker PIN
- `POST /api/admin/kiosk/enable` - Enable kiosk mode

### Time Clock
- `POST /api/time-entries/pin-toggle` - Clock in/out via PIN

### Payroll
- `GET /api/reports/payroll` - Generate payroll report
  - Query params: `startDate`, `endDate`, `userId?`, `locationId?`, `format?` (csv)

## Design Theme

- **Royal Purple**: #4B2E83 (primary)
- **Old Gold**: #C9A227 (accent)
- **Neutrals**: Charcoal, off-white, light gray

## Mobile-First Features

- Large touch targets (44px minimum)
- Spacious form inputs
- PIN keypad for easy entry
- Responsive layouts that scale to tablets/iPads
- Interactive date pickers and searchable selects

## AI Features (Optional)

When `GOOGLE_AI_API_KEY` is set, the app provides:
- Payroll report summaries
- Anomaly detection (missing clock-outs, long shifts)
- Smart insights

The app works fully without AI keys - features are non-blocking.

## Deployment to Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

The app is configured for Vercel serverless functions.

## License

Private - Tech ePhi Platform
