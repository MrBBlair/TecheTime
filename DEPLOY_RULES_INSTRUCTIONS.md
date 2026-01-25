# Deploy Firestore Security Rules - Quick Guide

## 🚀 Steps to Update Rules in Firebase Console

### 1. Open Firebase Console
Go directly to your Firestore Rules page:
**https://console.firebase.google.com/project/tech-etime-21021/firestore/rules**

### 2. Copy the Rules Below
Copy the entire content from the code block below:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Users can read/write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Businesses collection
    match /businesses/{businessId} {
      // Authenticated users can read businesses
      allow read: if request.auth != null;
      
      // Users can write if they belong to the business
      allow write: if request.auth != null &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        ((get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessIds != null &&
          businessId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessIds) ||
         (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessId != null &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessId == businessId));
      
      // Subcollections
      match /locations/{locationId} {
        allow read, write: if request.auth != null;
      }
      
      match /timeEntries/{entryId} {
        allow read, write: if request.auth != null;
      }
      
      match /deviceSessions/{sessionId} {
        allow read, write: if request.auth != null;
      }
      
      match /payRates/{rateId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

### 3. Paste and Publish
1. **Delete** all existing rules in the Firebase Console editor
2. **Paste** the rules above
3. Click **"Publish"** button
4. Wait for confirmation message

### 4. Verify
After publishing:
- Refresh your app
- Try logging in again
- The "Missing or insufficient permissions" error should be resolved

## ✅ What These Rules Fix

- ✅ Users can read/write their own user documents
- ✅ Authenticated users can read businesses
- ✅ Users can only write to businesses they belong to
- ✅ All subcollections require authentication

## 🔍 Troubleshooting

If you still get permission errors after updating:
1. Make sure you clicked "Publish" (not just "Save")
2. Wait 10-30 seconds for rules to propagate
3. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)
4. Try logging out and back in
