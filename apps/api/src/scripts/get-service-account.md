# Get Firebase Service Account JSON

> **Note:** If service account key creation is blocked by your organization's policies, use **Application Default Credentials (ADC)** instead. See [setup-adc.md](./setup-adc.md) for instructions. ADC is recommended and more secure.

## When to Use Service Account JSON

Use this method if:
- Your organization allows service account key creation
- You prefer managing credentials via environment variables
- You're deploying to a platform that requires explicit credentials

## Quick Steps

1. Go to: https://console.firebase.google.com/project/tech-etime-21021/settings/serviceaccounts/adminsdk
2. Click "Generate New Private Key"
3. Click "Generate Key" in the dialog
4. A JSON file will download
5. Open the JSON file and copy its entire contents
6. Paste it as a single line in `apps/api/.env` for `FIREBASE_SERVICE_ACCOUNT`

Example format in .env:
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tech-etime-21021","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Important:** The entire JSON must be on one line with escaped quotes.

## Alternative: Application Default Credentials

If you see an error that key creation is not allowed, use ADC instead:

1. See [setup-adc.md](./setup-adc.md) for ADC setup instructions
2. Run: `gcloud auth application-default login`
3. Remove `FIREBASE_SERVICE_ACCOUNT` from your `.env` file
4. The app will automatically use ADC
