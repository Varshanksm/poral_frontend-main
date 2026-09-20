# 🔄 Terminology Update: Credits → Hackathons

## 📝 Overview
The term **"Credits"** has been replaced with **"Hackathons Attended"** or **"Participation Count"** across the application to better reflect the purpose of the metric.

## 🛠️ Changes Made

### **Frontend (User Interface)**
- **Admin Dashboard:**
  - "Students with Low Credits" → **"Students with Low Participation"**
  - Table Column: "Credits" → **"Hackathons Attended"**
  - Alert Button: "Send Credit Alerts" → **"Send Participation Alerts"**
- **User Management:**
  - Student Table: "Credits" → **"Hackathons Attended"**
- **Student Dashboard:**
  - API calls updated to reflect new terminology.

### **Backend (API & Logic)**
- **Routes:**
  - `/admin/low-credits` → `/admin/low-participation`
  - `/admin/send-alerts` → `/admin/send-participation-alerts`
  - `/student/credits` → `/student/participation-count`
  - `/student/check-credits` → `/student/check-participation`
- **Email Templates:**
  - `creditAlert` → `participationAlert`
  - Email subject: "Participation Alert - Action Required"

### **Database**
- **Note:** The database field name `credits` in the `Student` collection remains unchanged to preserve existing data. It is now aliased as "Hackathons Attended" in the UI.

## 🚀 How to Verify
1.  **Admin Dashboard:** Check the "Overview" tab. The "Low Participation" section should now use the new terminology.
2.  **User Management:** Check the student table columns.
3.  **Emails:** Triggering an alert will now send a "Participation Alert" email.
