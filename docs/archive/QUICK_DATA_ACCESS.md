# 🎯 Quick Data Access Guide

## Where is Everything?

###     **Database Data** (MongoDB)
```
Students, Proctors, Admins, Hackathons, Participation Requests
```
**Access via:**
-   **MongoDB Compass** (Download: https://www.mongodb.com/products/compass)
-   **Admin Dashboard** (http://localhost:5173 → Login as Admin)
-   **MongoDB Shell** (`mongosh "your_mongo_uri"`)

### 📁 **Uploaded Files**
```
backend/uploads/
├── admin/              ← Hackathon posters
└── [certificates]      ← Student certificates
```
**Access via:**
-   File Explorer: Navigate to `backend/uploads/`
-   Browser: `http://localhost:5000/uploads/filename.pdf`

---

## 🚀 Easiest Way to View Data

### Option 1: Use Admin Dashboard (Built-in!)

1. **Open browser:** http://localhost:5173/login
2. **Login as Admin:**
   - Email: Your admin email
   - Password: Your admin password
   - Role: Admin

3. **View Everything:**
   - **Overview Tab:** Statistics, charts
   - **User Management Tab:** All students, proctors
   - **Hackathons:** All submissions
   - **Export to CSV:** Download all data

**What you can see:**
-   All students (name, email, register no, department, year)
-   All hackathons (title, student, status, date)
-   Participation requests
-   Statistics and charts

---

### Option 2: MongoDB Compass (Best for detailed view)

1. **Download:** https://www.mongodb.com/products/compass

2. **Get connection string:**
   - Open `backend/.env`
   - Copy `MONGO_URI` value

3. **Connect:**
   - Paste URI in Compass
   - Click "Connect"

4. **Browse collections:**
   - `students` → All student data
   - `hackathons` → All submissions
   - `upcominghackathons` → Upcoming events
   - `participationapprovals` → Enrollment requests

---

##   What Data is Stored?

### Students Collection
```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@student.tce.edu",
  "password": "$2b$10$encrypted...",  // Encrypted!
  "registerNo": "123456",
  "department": "CSBS",
  "year": "3rd",
  "participationCredits": 5,
  "createdAt": "2024-12-01T10:00:00Z"
}
```

### Hackathons Collection
```json
{
  "_id": "ObjectId",
  "studentId": "ObjectId (reference)",
  "hackathonTitle": "Google Hackathon 2024",
  "organization": "Google",
  "mode": "Online",
  "startDate": "2024-11-01",
  "endDate": "2024-11-03",
  "certificatePath": "uploads/1733123789-cert.pdf",
  "status": "Accepted",
  "proctorId": "ObjectId (reference)",
  "createdAt": "2024-12-01T10:00:00Z"
}
```

### Upcoming Hackathons Collection
```json
{
  "_id": "ObjectId",
  "title": "AI Hackathon 2025",
  "organization": "Microsoft",
  "description": "Build AI solutions",
  "posterPath": "uploads/admin/1733123456-poster.jpg",
  "registrationDeadline": "2025-01-15",
  "hackathonDate": "2025-01-20",
  "mode": "Hybrid",
  "maxParticipants": 100,
  "createdBy": "ObjectId (admin)"
}
```

---

## 🔍 Quick Commands

### View All Students
```javascript
// MongoDB Shell
db.students.find().pretty()

// Count
db.students.countDocuments()
```

### View All Hackathons
```javascript
db.hackathons.find().pretty()

// Only accepted
db.hackathons.find({ status: "Accepted" })

// Only pending
db.hackathons.find({ status: "Pending" })
```

### Find Specific Student
```javascript
db.students.findOne({ email: "student@student.tce.edu" })
```

### View Uploaded Files
```bash
# In terminal
cd backend/uploads
ls -la

# View posters
ls -la admin/
```

---

## 📥 How to Download/Export Data

### From Admin Dashboard:
1. Login as admin
2. Click "📥 Export to CSV"
3. File downloads automatically

### From MongoDB Compass:
1. Select collection
2. Click "Export Collection"
3. Choose JSON or CSV
4. Save

### From Command Line:
```bash
mongoexport --uri="your_mongo_uri" --collection=students --out=students.json
```

---

## 🔐 Important Notes

### Passwords
- ❌ **Cannot see plain text passwords**
-   Encrypted with bcrypt
-   Use "Forgot Password" to reset

### Files
-   Certificates: `backend/uploads/`
-   Posters: `backend/uploads/admin/`
-   Access via browser when server running

### Database
-   Connection string in `backend/.env`
-   All data in MongoDB
-   Use Compass for easy viewing

---

## 🎯 Summary

| What | Where | How to Access |
|------|-------|---------------|
| **Student Data** | MongoDB `students` | Admin Dashboard / Compass |
| **Passwords** | MongoDB (encrypted) | Cannot view - use reset |
| **Hackathons** | MongoDB `hackathons` | Admin Dashboard / Compass |
| **Certificates** | `backend/uploads/` | File Explorer / Browser |
| **Posters** | `backend/uploads/admin/` | File Explorer / Browser |
| **Statistics** | Calculated from DB | Admin Dashboard |

---

## 💡 Recommended Workflow

1. **Daily Viewing:** Use Admin Dashboard
2. **Detailed Analysis:** Use MongoDB Compass
3. **File Access:** Navigate to `backend/uploads/`
4. **Data Export:** Use CSV export from dashboard
5. **Backups:** Regular MongoDB dumps

---

## Need Help?

**Check:** `DATA_STORAGE_GUIDE.md` for detailed instructions!
