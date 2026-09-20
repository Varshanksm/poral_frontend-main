# Codeathon Submission Error - Quick Fix Guide

## Problem
Getting an error when submitting a Codeathon event.

## Likely Causes
1. **Old database indexes** - The database might have old unique indexes that conflict with the new schema
2. **Backend not restarted** - The backend server needs to be restarted after model changes
3. **Missing eventType field** - Existing documents don't have the eventType field

## Solution

### Option 1: Run Migration Script (Recommended)

1. **Stop the backend server** (Ctrl+C in the backend terminal)

2. **Run the migration script:**
   ```bash
   cd backend
   node migrations/add-codeathon-support.js
   ```

3. **Restart the backend server:**
   ```bash
   npm start
   ```

4. **Try submitting a Codeathon again**

---

### Option 2: Manual Database Fix (If migration fails)

If you have MongoDB Compass or mongo shell access:

1. **Connect to your database**

2. **Drop the old unique index:**
   ```javascript
   db.hackathons.dropIndex("hackathonTitle_1_year_1")
   ```

3. **Create new compound unique index:**
   ```javascript
   db.hackathons.createIndex(
     { studentId: 1, hackathonTitle: 1, year: 1 },
     { unique: true }
   )
   ```

4. **Update existing documents:**
   ```javascript
   db.hackathons.updateMany(
     { eventType: { $exists: false } },
     { $set: { eventType: "Hackathon" } }
   )
   ```

5. **Restart backend server**

---

### Option 3: Quick Restart (Simplest)

Sometimes just restarting the backend is enough:

1. **Stop backend** (Ctrl+C)
2. **Start backend** (`npm start`)
3. **Try again**

---

## Verification

After applying the fix, verify:

1.   Backend starts without errors
2.   Can submit a Hackathon
3.   Can submit a Codeathon
4.   Event type badge shows correctly

---

## Common Error Messages & Solutions

### Error: "Hackathon validation failed: eventType: Path `eventType` is required"
**Solution:** The eventType field is missing from the request. Make sure you're using the updated frontend code.

### Error: "E11000 duplicate key error"
**Solution:** Run the migration script to fix the indexes.

### Error: "Cast to enum failed for value"
**Solution:** Make sure you're selecting either "Hackathon" or "Codeathon" (case-sensitive).

---

## Still Having Issues?

Check the browser console (F12) for frontend errors and the backend terminal for server errors. Share the specific error message for more targeted help.
