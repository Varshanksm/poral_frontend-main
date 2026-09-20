# 📥 Data Export Features

##   Export Functionality Added

You can now export data as **CSV files** (compatible with Excel/Google Sheets) from the Admin Dashboard.

### 1.    Hackathons Export
- **Where:** "   Hackathons" tab
- **Button:** `📥 Export CSV` (Top right)
- **What's Exported:**
  - Title
  - Student Name & Register No
  - Department & Year
  - Organization
  - Date
  - Status (Accepted/Pending/Declined)
  - Assigned Proctor
- **Note:** It exports the **currently filtered list** (e.g., if you filter by "Pending", it exports only pending hackathons).

### 2. 🚀 Upcoming Hackathons Export
- **Where:** "🚀 Upcoming Hackathons" tab
- **Button:** `📥 Export CSV` (Top right)
- **What's Exported:**
  - Title
  - Organization
  - Date & Deadline
  - Mode & Location
  - Max Participants

### 3.   Student Data Export
- **Where:** "  User Management" tab
- **Button:** `📥 Export Students CSV` (Top right)
- **What's Exported:**
  - Name
  - Email
  - Register No
  - Department & Year
  - Participation Credits
  - Assigned Proctor

---

## 🐛 Bug Fix: Accepted Hackathon Count
- **Fixed:** The "Accepted" count in the Overview dashboard now correctly reflects the number of hackathons with "Accepted" status.
- **Why it was broken:** The system was looking for "Approved" status instead of "Accepted". This has been corrected.

---

## 🚀 How to Use
1. Go to the desired tab (Hackathons, Upcoming, or User Management).
2. Click the green **"📥 Export CSV"** button.
3. The file will automatically download to your computer.
4. Open with Excel, Numbers, or Google Sheets.
