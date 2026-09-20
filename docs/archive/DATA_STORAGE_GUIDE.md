#     Data Storage Guide - TCE CSBS Hackathon Portal

## Where is Data Stored?

### 1. 🗄️ Database (MongoDB)
**Location:** MongoDB Database (configured in `.env` file)

**Connection String:** Check `backend/.env` file for `MONGO_URI`

All user data, hackathons, and submissions are stored in MongoDB collections.

---

## 📁 Database Collections

### Collection 1: `students`
**What's stored:**
- Username (name)
- Email
- Password (encrypted with bcrypt)
- Register Number
- Department
- Year
- Participation Credits
- Created/Updated timestamps

**How to view:**
```bash
# Using MongoDB Compass (GUI)
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect using your MONGO_URI from .env
3. Browse to your database
4. Click on "students" collection

# Using MongoDB Shell
mongosh "your_mongo_uri_here"
use your_database_name
db.students.find().pretty()

# View specific student
db.students.findOne({ email: "student@student.tce.edu" })
```

---

### Collection 2: `proctors`
**What's stored:**
- Name
- Email
- Password (encrypted)
- Department
- Assigned students

**How to view:**
```bash
db.proctors.find().pretty()
```

---

### Collection 3: `admins`
**What's stored:**
- Name
- Email
- Password (encrypted)

**How to view:**
```bash
db.admins.find().pretty()
```

---

### Collection 4: `hackathons`
**What's stored:**
- Student ID (reference)
- Hackathon Title
- Organization
- Mode (Online/Offline)
- Start Date / End Date
- Certificate Path (file location)
- Status (Pending/Accepted/Declined)
- Proctor ID (assigned)
- Submission timestamp

**How to view:**
```bash
# All hackathons
db.hackathons.find().pretty()

# Hackathons by student
db.hackathons.find({ studentId: ObjectId("student_id_here") })

# Pending hackathons
db.hackathons.find({ status: "Pending" })

# Accepted hackathons
db.hackathons.find({ status: "Accepted" })
```

---

### Collection 5: `upcominghackathons`
**What's stored:**
- Title
- Organization
- Description
- Poster Path (file location)
- Registration Deadline
- Hackathon Date
- Mode (Online/Offline)
- Location
- Max Participants
- Created By (Admin ID)

**How to view:**
```bash
db.upcominghackathons.find().pretty()
```

---

### Collection 6: `participationapprovals`
**What's stored:**
- Student ID
- Upcoming Hackathon ID
- Proctor ID
- Status (Pending/Approved/Declined)
- Enrollment Details (student info, experience, motivation, etc.)
- Approval/Rejection timestamps

**How to view:**
```bash
# All participation requests
db.participationapprovals.find().pretty()

# Pending requests
db.participationapprovals.find({ status: "Pending" })

# Approved requests
db.participationapprovals.find({ status: "Approved" })
```

---

## 📂 File Storage (Uploaded Files)

### Location: `backend/uploads/`

**Directory Structure:**
```
backend/
└── uploads/
    ├── admin/          # Hackathon posters uploaded by admin
    │   └── 1733123456-poster.jpg
    └── certificates/   # Student certificates
        └── 1733123789-certificate.pdf
```

### How to Access Files:

**1. Direct File System:**
```bash
# Navigate to backend folder
cd backend

# List all uploaded certificates
ls uploads/

# View admin uploads (posters)
ls uploads/admin/

# View student certificates
ls uploads/
```

**2. Via Browser (when server is running):**
```
# Posters
http://localhost:5000/uploads/admin/filename.jpg

# Certificates
http://localhost:5000/uploads/filename.pdf
```

---

## 🔍 How to View All Data

### Method 1: MongoDB Compass (Recommended - GUI)

**Steps:**
1. **Download MongoDB Compass**
   - https://www.mongodb.com/products/compass

2. **Get Connection String**
   - Open `backend/.env`
   - Copy the `MONGO_URI` value

3. **Connect**
   - Paste URI in Compass
   - Click "Connect"

4. **Browse Data**
   - Select your database
   - Click on any collection
   - View all documents

**Features:**
-   Visual interface
-   Search and filter
-   Edit documents
-   Export data
-   View relationships

---

### Method 2: MongoDB Shell (Command Line)

**Steps:**
```bash
# Connect to MongoDB
mongosh "your_mongo_uri_here"

# Switch to your database
use your_database_name

# View all students
db.students.find().pretty()

# View all hackathons
db.hackathons.find().pretty()

# Count documents
db.students.countDocuments()
db.hackathons.countDocuments()

# Find specific data
db.students.findOne({ email: "student@student.tce.edu" })

# View with specific fields only
db.students.find({}, { name: 1, email: 1, registerNo: 1 })
```

---

### Method 3: Admin Dashboard (Web Interface)

**Already Built-In!**

1. **Login as Admin**
   - Go to http://localhost:5173/login
   - Select "Admin" role
   - Login with admin credentials

2. **View Data:**
   - **Overview Tab:** Statistics and charts
   - **User Management Tab:** All students, proctors, admins
   - **Hackathons:** All submitted hackathons
   - **Upcoming Hackathons:** Manage upcoming events

**What you can see:**
-   Total students
-   Total hackathons
-   Pending/Accepted/Declined counts
-   Student list with details
-   Hackathon submissions
-   Export to CSV

---

### Method 4: Proctor Dashboard

**View Assigned Students' Data:**

1. **Login as Proctor**
   - Go to http://localhost:5173/login
   - Select "Proctor" role
   - Login

2. **View:**
   - **Participation Approval Tab:** Student enrollment requests
   - **Certification Verification Tab:** Student submissions
   - Approve/Decline requests
   - View student details

---

##     Common Queries

### View All Students with Passwords (Encrypted)
```javascript
db.students.find({}, { name: 1, email: 1, password: 1 })
```
**Note:** Passwords are encrypted with bcrypt - you cannot see plain text!

### View All Certificates Uploaded
```javascript
db.hackathons.find({}, { 
    studentId: 1, 
    hackathonTitle: 1, 
    certificatePath: 1,
    status: 1 
})
```

### View Student's Complete Profile
```javascript
db.students.findOne({ email: "student@student.tce.edu" })
```

### View All Hackathons by a Student
```javascript
// First get student ID
const student = db.students.findOne({ email: "student@student.tce.edu" })

// Then find their hackathons
db.hackathons.find({ studentId: student._id })
```

### View Hackathons Pending Approval
```javascript
db.hackathons.find({ status: "Pending" }).pretty()
```

---

## 🔐 Password Information

**Important:** Passwords are **encrypted** using bcrypt!

**You CANNOT see plain text passwords!**

**Why?**
- Security best practice
- Protects user data
- Even admins can't see passwords

**How to reset a password?**
1. Use "Forgot Password" feature (sends email)
2. Or manually update in database:

```javascript
// In MongoDB shell
const bcrypt = require('bcrypt');
const newPassword = await bcrypt.hash('newpassword123', 10);

db.students.updateOne(
    { email: "student@student.tce.edu" },
    { $set: { password: newPassword } }
)
```

---

## 📁 File Paths in Database

**Certificate paths are stored as:**
```
uploads/1733123789-certificate.pdf
```

**To access the file:**
1. **File System:** `backend/uploads/1733123789-certificate.pdf`
2. **Browser:** `http://localhost:5000/uploads/1733123789-certificate.pdf`

**Poster paths are stored as:**
```
uploads/admin/1733123456-poster.jpg
```

**To access:**
1. **File System:** `backend/uploads/admin/1733123456-poster.jpg`
2. **Browser:** `http://localhost:5000/uploads/admin/1733123456-poster.jpg`

---

## 🛠️ Useful MongoDB Commands

```javascript
// Count total students
db.students.countDocuments()

// Count hackathons by status
db.hackathons.countDocuments({ status: "Accepted" })
db.hackathons.countDocuments({ status: "Pending" })

// Find students by department
db.students.find({ department: "CSBS" })

// Find hackathons by mode
db.hackathons.find({ mode: "Online" })

// Get latest 10 hackathons
db.hackathons.find().sort({ createdAt: -1 }).limit(10)

// Export to JSON
mongoexport --uri="your_mongo_uri" --collection=students --out=students.json

// Backup entire database
mongodump --uri="your_mongo_uri" --out=backup/
```

---

## 📥 Export Data

### From Admin Dashboard:
1. Login as admin
2. Click "📥 Export to CSV" button
3. Downloads all hackathon data

### From MongoDB Compass:
1. Select collection
2. Click "Export Collection"
3. Choose format (JSON/CSV)
4. Save file

### From Command Line:
```bash
# Export students
mongoexport --uri="your_mongo_uri" --collection=students --out=students.json

# Export hackathons
mongoexport --uri="your_mongo_uri" --collection=hackathons --out=hackathons.json
```

---

## 🔍 Quick Reference

| Data Type | Database Collection | File Location |
|-----------|-------------------|---------------|
| Student Info | `students` | N/A |
| Proctor Info | `proctors` | N/A |
| Admin Info | `admins` | N/A |
| Hackathon Submissions | `hackathons` | N/A |
| Certificates | Certificate path in `hackathons` | `backend/uploads/` |
| Upcoming Hackathons | `upcominghackathons` | N/A |
| Posters | Poster path in `upcominghackathons` | `backend/uploads/admin/` |
| Participation Requests | `participationapprovals` | N/A |

---

## 💡 Pro Tips

1. **Use MongoDB Compass** for easy viewing
2. **Admin Dashboard** shows most important data
3. **Passwords are encrypted** - use forgot password to reset
4. **Files are in** `backend/uploads/`
5. **Export data regularly** for backups
6. **Check `.env`** for database connection string

---

## Need Help?

**Can't connect to MongoDB?**
- Check `backend/.env` file
- Verify `MONGO_URI` is correct
- Make sure MongoDB is running

**Can't see files?**
- Check `backend/uploads/` folder
- Files are named with timestamps
- Access via browser when server is running

**Want to see specific data?**
- Use MongoDB Compass (easiest)
- Or use admin dashboard
- Or use MongoDB shell commands above
