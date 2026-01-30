# Tech eTime: Fresh Setup Walkthrough

This guide walks you through connecting the merged Tech eTime app to **GitHub**, **Firebase**, and **Vercel** from scratch. Do not reuse old API keys or project IDs; set everything up freshly.

---

## 1. GitHub (Repository)

1. **Create a new repository** (or use an existing empty one):
   - On GitHub: **New repository** → name it (e.g. `tech-etime`) → **Create repository** (no README, no .gitignore if you already have them in the project).

2. **Initialize and push from your machine** (from the project root):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: merged Tech eTime app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name.

3. **Do not commit**:
   - `.env`, `.env.local`, or any file containing real API keys or secrets.
   - The repo already has `.gitignore` excluding `.env` and common secret paths.

4. **Optional**: Enable branch protection on `main` (e.g. require PR reviews) in **Settings → Branches**.

---

## 2. Firebase (Project and Auth)

1. **Create a new Firebase project** (or select an existing one):
   - Go to [Firebase Console](https://console.firebase.google.com/) → **Add project** (or select project).
   - Note the **Project ID** (e.g. `your-project-id`).

2. **Enable Authentication**:
   - In the project: **Build → Authentication** → **Get started**.
   - Enable **Email/Password** (and any other sign-in methods you need).

3. **Create a Web App**:
   - **Project overview** (gear) → **Project settings** → **Your apps** → **Add app** → **Web** (`</>`).
   - Register app with a nickname (e.g. "Tech eTime Web").
   - Copy the **firebaseConfig** object (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).

4. **Configure environment variables** (local and later Vercel):
   - In the project root or `apps/web`, create `.env` (do not commit it) and set:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
   Use the values from the Firebase config you copied.

5. **Firestore**:
   - **Build → Firestore Database** → **Create database** (start in production or test mode as needed).
   - Deploy **Firestore rules** and **indexes**:
     - If you have `firestore.rules` and `firestore.indexes.json` in the repo, use Firebase CLI:
       ```bash
       npm install -g firebase-tools
       firebase login
       firebase use your-project-id
       firebase deploy --only firestore:rules
       firebase deploy --only firestore:indexes
       ```
     - Otherwise, configure rules and indexes manually in the Firebase Console to match your app’s collections (e.g. `users`, `businesses`, `locations`, `timeEntries`).

6. **Service account (for the API backend)**:
   - **Project settings** → **Service accounts** → **Generate new private key**.
   - Save the JSON file securely. You will add its contents to Vercel (or your API host) as an environment variable (e.g. `FIREBASE_SERVICE_ACCOUNT` as the full JSON string, or use a file path if your host supports it).

7. **Update `.firebaserc`** (optional, for Firebase CLI):
   - Set the default project to your real project ID:
   ```json
   {
     "projects": {
       "default": "your-actual-firebase-project-id"
     }
   }
   ```
   Do not commit the service account JSON file.

---

## 3. Vercel (Deployment)

1. **Create a Vercel project from GitHub**:
   - Go to [Vercel](https://vercel.com) → **Add New → Project**.
   - Import your GitHub repository (e.g. `YOUR_USERNAME/YOUR_REPO`).
   - **Root Directory**: leave as the repo root (the monorepo root).

2. **Configure build and output**:
   - **Framework Preset**: Other (or Vite if detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `apps/web/dist`
   - **Install Command**: `npm install`
   - **Root Directory**: `.` (repo root)

3. **Environment variables** (in Vercel → Project → **Settings → Environment Variables**):
   - Add all variables from `.env.example`:
     - **Web (build-time)**: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and optionally `VITE_API_URL` (if your API is on a different domain).
     - **API (runtime)**: `PORT`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT` (paste the full service account JSON string), `POSTMARK_API_TOKEN`, `POSTMARK_FROM_EMAIL`, `GOOGLE_AI_API_KEY`, `FRONTEND_URL` (e.g. `https://your-app.vercel.app`).

4. **Deploy**:
   - Click **Deploy**. Vercel will build and deploy.
   - The frontend will be at a URL like `https://your-project.vercel.app`.
   - If the API is deployed as serverless functions (e.g. under `/api`), ensure the API route is configured (e.g. `apps/web/api/[...path].ts` or your API entry) and that `FRONTEND_URL` and CORS allow your frontend origin.

5. **Custom domain** (optional):
   - In Vercel → **Settings → Domains**, add your domain and follow the DNS instructions.

---

## Summary Checklist

- [ ] GitHub repo created and code pushed (no `.env` or secrets committed).
- [ ] Firebase project created; Auth (Email/Password) and Firestore enabled.
- [ ] Web app registered in Firebase; config copied into `VITE_*` env vars.
- [ ] Firestore rules and indexes deployed (or configured in Console).
- [ ] Service account key generated; stored only in Vercel (or secure secret store), not in repo.
- [ ] Vercel project linked to GitHub; build command `npm run build`, output `apps/web/dist`.
- [ ] All env vars from `.env.example` set in Vercel (both Vite and API vars).
- [ ] Deploy successful; login and critical flows tested.

After completing these steps, your Tech eTime app will be connected to GitHub, Firebase, and Vercel with a fresh configuration.
