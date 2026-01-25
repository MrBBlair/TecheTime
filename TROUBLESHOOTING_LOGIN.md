# Troubleshooting Admin Login

## Issue: Unable to login to admin sign-on

### Quick Checks

1. **Verify Email/Password Authentication is Enabled**
   - Go to: https://console.firebase.google.com/project/tech-etime-21021/authentication/providers
   - Click on "Email/Password"
   - Make sure "Email/Password" is **Enabled**
   - Click "Save" if you made changes

2. **Verify Test Account Exists**
   - Email: `admin@techetime.demo`
   - Password: `demo1234`
   - User exists in Firebase Auth: ✅ Verified
   - User document exists in Firestore: ✅ Verified

3. **Check Browser Console**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Try logging in and check for error messages
   - Common errors:
     - `auth/operation-not-allowed` → Email/Password auth not enabled
     - `auth/user-not-found` → User doesn't exist
     - `auth/wrong-password` → Incorrect password
     - `auth/invalid-email` → Invalid email format
     - `auth/network-request-failed` → Network/CORS issue

4. **Verify Firebase Configuration**
   - Check `apps/web/.env` has correct values:
     - `VITE_FIREBASE_API_KEY=AIzaSyCRvtWuroG9BlURk-qlt7PcEHgRr2tmYXU`
     - `VITE_FIREBASE_PROJECT_ID=tech-etime-21021`
   - Restart dev server after changing `.env` file

5. **Check API Server**
   - API should be running on http://localhost:3001
   - Check terminal for any errors

### Common Solutions

**If you see "auth/operation-not-allowed":**
- Enable Email/Password authentication in Firebase Console
- Link: https://console.firebase.google.com/project/tech-etime-21021/authentication/providers

**If you see CORS errors:**
- Make sure API server is running on port 3001
- Check `apps/api/.env` has correct `FRONTEND_URL` (default: http://localhost:5173)

**If credentials don't work:**
- Re-run seed script: `npm run seed`
- This will recreate the test account if needed

### Test Login Programmatically

You can test if the user can authenticate:

```bash
# The user exists and is verified:
# Email: admin@techetime.demo
# Password: demo1234
# UID: KcZwiL8BgNgumkRjYfK6VxlcRES2
```

### Still Having Issues?

1. Check browser console for specific error messages
2. Check API server logs for errors
3. Verify Firebase project settings match your `.env` files
4. Try clearing browser cache and cookies
5. Try in an incognito/private window
