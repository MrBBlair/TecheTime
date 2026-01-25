# Deploy Firestore Security Rules - Fix Permission Error

## 🚨 Issue
The Firestore security rules are not deployed to production, causing "Missing or insufficient permissions" errors.

## ✅ Solution: Deploy Rules via Firebase Console

### Step 1: Open Firebase Console
Go directly to your Firestore Rules page:
**https://console.firebase.google.com/project/tech-etime-21021/firestore/rules**

### Step 2: Copy Rules from `firestore.rules`
Copy the entire content from `/Users/brianproctor/TecheTime-main/firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is SUPERADMIN
    // Note: This reads the user's own document, which is always allowed
    function isSuperAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'SUPERADMIN';
    }
    
    // Users collection
    match /users/{userId} {
      // Users can always read/write their own document
      // SUPERADMIN can read any user document (for cross-business management)
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      (request.auth.uid != userId && isSuperAdmin()));
      // Users can only write their own document
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Businesses collection
    match /businesses/{businessId} {
      // Authenticated users can read businesses
      // SUPERADMIN can read/write any business
      allow read: if request.auth != null;
      allow write: if request.auth != null && isSuperAdmin();
      
      // Regular users can write if they belong to the business
      allow write: if request.auth != null &&
        !isSuperAdmin() &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        ((get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessIds != null &&
          businessId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessIds) ||
         (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessId != null &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessId == businessId));
      
      // Subcollections
      match /locations/{locationId} {
        // SUPERADMIN can read/write any location
        allow read, write: if request.auth != null && isSuperAdmin();
        // Regular users can read/write if authenticated
        allow read, write: if request.auth != null;
      }
      
      match /timeEntries/{entryId} {
        // SUPERADMIN can read/write any time entry
        allow read, write: if request.auth != null && isSuperAdmin();
        // Regular users can read/write if authenticated
        allow read, write: if request.auth != null;
      }
      
      match /deviceSessions/{sessionId} {
        // SUPERADMIN can read/write any device session
        allow read, write: if request.auth != null && isSuperAdmin();
        // Regular users can read/write if authenticated
        allow read, write: if request.auth != null;
      }
      
      match /payRates/{rateId} {
        // SUPERADMIN can read/write any pay rate
        allow read, write: if request.auth != null && isSuperAdmin();
        // Regular users can read/write if authenticated
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

### Step 3: Paste and Publish
1. **Delete** all existing rules in the Firebase Console editor
2. **Paste** the rules above
3. Click **"Publish"** button
4. Wait for confirmation message (usually takes 10-30 seconds)

### Step 4: Verify
After publishing:
1. The rules should show as "Published" in the console
2. Try logging in to your production app again
3. The permission error should be resolved

## 🔍 What These Rules Do

- **Users Collection**: Users can read/write their own document. SUPERADMIN can read any user document.
- **Businesses Collection**: Authenticated users can read businesses. Users can write if they belong to the business.
- **Subcollections**: Authenticated users can read/write locations, timeEntries, deviceSessions, and payRates.

## ⚠️ Important Notes

- Rules take effect immediately after publishing
- No downtime during rule deployment
- Rules are evaluated on every Firestore read/write operation
- Make sure you're logged in with the correct Google account that has Firebase admin access
