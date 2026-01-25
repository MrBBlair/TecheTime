# Vercel Login Instructions

## Option 1: Device Code Login (Recommended)

1. Run this command in your terminal:
   ```bash
   npx vercel login
   ```

2. You'll see a URL like: `https://vercel.com/oauth/device?user_code=XXXX-XXXX`

3. **Copy that URL** and open it in your browser manually

4. Enter the user code shown in the terminal

5. Complete authentication in the browser

6. Return to the terminal - it should show "Success! Logged in as: [your-email]"

## Option 2: Token-Based Login

1. Go to https://vercel.com/account/tokens

2. Create a new token (give it a name like "Tech eTime Deployment")

3. Copy the token

4. Run this command:
   ```bash
   npx vercel login --token YOUR_TOKEN_HERE
   ```

## Option 3: Email Login

1. Run:
   ```bash
   npx vercel login --email your-email@example.com
   ```

2. Check your email for the login link

3. Click the link to authenticate

## Verify Login

After logging in, verify with:
```bash
npx vercel whoami
```

This should show your email address.
