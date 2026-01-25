# Firestore Indexes Required

This document lists all required Firestore composite indexes for optimal performance.

## Required Indexes

### 1. Device Sessions Collection Group Index (CRITICAL)
**Collection**: `deviceSessions` (collectionGroup)  
**Fields**: `__name__` (ascending)  
**Purpose**: Enables fast device session lookup in kiosk mode  
**Impact**: Without this index, device session lookup falls back to scanning all businesses sequentially (O(n*m) complexity)

**How to create**:
```bash
# Using Firebase CLI
firebase firestore:indexes

# Or manually in Firebase Console:
# Firestore → Indexes → Create Index
# Collection ID: deviceSessions (select "Collection group")
# Query scope: Collection group
# Fields: __name__ (Ascending)
```

### 2. Time Entries - Payroll Reports
**Collection**: `businesses/{businessId}/timeEntries`  
**Fields**: 
- `clockInAt` (Ascending)
- `userId` (Ascending) [optional]
- `locationId` (Ascending) [optional]

**Purpose**: Enables date-range filtering for payroll reports  
**Impact**: Without this index, payroll reports fetch all entries and filter client-side (very slow for large datasets)

**How to create**:
```bash
# Create composite index for date range queries
# Firebase Console → Firestore → Indexes → Create Index
# Collection: timeEntries
# Fields:
#   - clockInAt: Ascending
#   - userId: Ascending (optional, for user-specific reports)
#   - locationId: Ascending (optional, for location-specific reports)
```

### 3. Time Entries - User Time Logs
**Collection**: `businesses/{businessId}/timeEntries`  
**Fields**:
- `userId` (Ascending)
- `clockInAt` (Ascending)

**Purpose**: Enables efficient time entry lookups for individual users  
**Impact**: Improves performance of time entry logs and pay period summaries

**How to create**:
```bash
# Firebase Console → Firestore → Indexes → Create Index
# Collection: timeEntries
# Fields:
#   - userId: Ascending
#   - clockInAt: Ascending
```

### 4. Users - Worker PIN Lookup (Optional Optimization)
**Collection**: `users`  
**Fields**:
- `businessId` (Ascending)
- `role` (Ascending)
- `pinEnabled` (Ascending)
- `isActive` (Ascending)

**Purpose**: Optimizes worker PIN lookup queries  
**Impact**: Currently queries are efficient, but this ensures optimal performance at scale

**Note**: This index is already efficient with the current query structure, but may be needed if query patterns change.

## Index Creation Methods

### Method 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore → Indexes
4. Click "Create Index"
5. Fill in the collection and fields as specified above
6. Click "Create"

### Method 2: Firebase CLI
Create a `firestore.indexes.json` file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "deviceSessions",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        {
          "fieldPath": "__name__",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "timeEntries",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "clockInAt",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "timeEntries",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "clockInAt",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "locationId",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then run:
```bash
firebase deploy --only firestore:indexes
```

### Method 3: Auto-Generated from Errors
When you run queries that require indexes, Firestore will:
1. Return an error with a link to create the index
2. Click the link to auto-generate the index configuration
3. Deploy the index

## Performance Impact

### Without Indexes
- Device session lookup: **10+ seconds** (scans all businesses)
- Payroll reports: **30+ seconds** (fetches all entries)
- Time entry logs: **5+ seconds** (fetches all user entries)

### With Indexes
- Device session lookup: **<200ms**
- Payroll reports: **<2 seconds**
- Time entry logs: **<500ms**

## Monitoring

Check index usage in Firebase Console:
1. Firestore → Usage → Indexes
2. Monitor index build status and usage statistics
3. Set up alerts for index build failures

## Troubleshooting

### Index Build Failed
- Check Firestore quotas and limits
- Ensure field types match index definition
- Verify collection names are correct

### Query Still Slow
- Verify index is built (status: "Enabled")
- Check query matches index field order
- Consider adding additional fields to index if needed

### Collection Group Query Fails
- Ensure `deviceSessions` collection group index exists
- Check that query uses `collectionGroup()` not `collection()`
- Verify `__name__` field is indexed
