# Codeathon Support Implementation

## Overview
Added support for **Codeathon** events alongside existing Hackathon functionality. Students can now submit certificates for both Hackathons and Codeathons through a unified interface.

---

## Changes Made

### 1. **Backend Model Update**
**File: `backend/models/Hackathon.js`**

#### Added Field:
```javascript
eventType: { 
    type: String, 
    required: true, 
    enum: ['Hackathon', 'Codeathon'], 
    default: 'Hackathon' 
}
```

**Features:**
- Enum validation ensures only valid event types
- Default value 'Hackathon' for backward compatibility
- Required field for all new submissions

---

### 2. **Backend Controller Update**
**File: `backend/controllers/hackathonController.js`**

#### Changes:
- Added `eventType` to request body extraction
- Included `eventType` in hackathon creation with default fallback
- Maintains backward compatibility with existing submissions

```javascript
const { ..., eventType } = req.body;
// ...
eventType: eventType || 'Hackathon',
```

---

### 3. **Frontend Student Dashboard**
**File: `frontend/src/pages/StudentDashboard.jsx`**

#### Major Updates:

##### A. Form State Management
- Added `eventType: 'Hackathon'` to initial form data
- Included in form reset logic

##### B. Event Type Selector
Added dropdown at the top of submission form:
```jsx
<select name="eventType" value={formData.eventType} onChange={handleChange}>
    <option value="Hackathon">Hackathon</option>
    <option value="Codeathon">Codeathon</option>
</select>
```

##### C. Dynamic Labels & Placeholders
- **Title Label**: Changes from "Hackathon Title" to "Codeathon Title" based on selection
- **Placeholders**: 
  - Hackathon: "e.g., Smart India Hackathon, CodeFest"
  - Codeathon: "e.g., Google Code Jam, LeetCode Contest"
- **Submit Button**: "Submit Hackathon" → "Submit Codeathon" (dynamic)

##### D. Event Type Badge
Added visual badge to display event type on submission cards:
- **Hackathon**: Pink badge (#fce4ec background, #c2185b text)
- **Codeathon**: Blue badge (#e3f2fd background, #0277bd text)

##### E. UI Text Updates
- "My Hackathons" → "My Events"
- "Submit Hackathon Details" → "Submit Event Details"
- "New Hackathon Submission" → "New Event Submission"
- "No hackathons submitted yet" → "No events submitted yet"

---

## Visual Design

### Event Type Badge Colors:
| Event Type | Background | Text Color | Border |
|------------|------------|------------|--------|
| Hackathon  | #fce4ec (Light Pink) | #c2185b (Dark Pink) | #f48fb1 |
| Codeathon  | #e3f2fd (Light Blue) | #0277bd (Dark Blue) | #90caf9 |

### Badge Display Order:
1. **Event Type** (Hackathon/Codeathon)
2. **Attendance Status** (Attended/Registered/Did Not Attend)
3. **Achievement Level** (Winner/Runner-up/Participation)

---

## User Flow

### Submitting a Codeathon:
1. Student clicks "Submit Event Details"
2. Selects "Codeathon" from Event Type dropdown
3. Form labels update dynamically:
   - "Codeathon Title *"
   - Placeholder shows codeathon examples
4. Fills in event details
5. Clicks "Submit Codeathon"
6. Submission appears with blue "Codeathon" badge

### Viewing Submissions:
- All events (Hackathons and Codeathons) appear in "My Events" section
- Each card shows event type badge for easy identification
- Filtering and sorting work across all event types

---

## Database Compatibility

### Existing Data:
- All existing submissions automatically have `eventType: 'Hackathon'` (via default)
- No data migration required
- Backward compatible with old submissions

### New Submissions:
- Must include `eventType` field
- Validated against enum ['Hackathon', 'Codeathon']
- Stored with explicit event type

---

## Future Enhancements (Conference Support)

When adding Conference support, follow this pattern:

### 1. Update Model:
```javascript
enum: ['Hackathon', 'Codeathon', 'Conference']
```

### 2. Update Frontend:
```jsx
<option value="Conference">Conference</option>
```

### 3. Add Badge Color:
```javascript
background: eventType === 'Conference' ? '#e8f5e9' : ...
color: eventType === 'Conference' ? '#2e7d32' : ...
```

**Suggested Conference Colors:**
- Background: #e8f5e9 (Light Green)
- Text: #2e7d32 (Dark Green)
- Border: #a5d6a7

---

## Testing Checklist

###   Backend:
- [ ] Submit hackathon with eventType='Hackathon'
- [ ] Submit codeathon with eventType='Codeathon'
- [ ] Submit without eventType (should default to 'Hackathon')
- [ ] Verify database stores eventType correctly

###   Frontend:
- [ ] Event Type dropdown appears in form
- [ ] Selecting Codeathon updates labels dynamically
- [ ] Placeholder text changes based on selection
- [ ] Submit button text updates
- [ ] Event type badge displays correctly on cards
- [ ] Badge colors match specification
- [ ] Existing hackathons show "Hackathon" badge

###   Integration:
- [ ] Autocomplete works for both event types
- [ ] Multiple students can submit same codeathon
- [ ] Proctor can approve/reject codeathons
- [ ] Admin dashboard shows event type
- [ ] Credits calculated correctly for codeathons

---

## API Changes

### Submit Event Endpoint
**POST** `/api/hackathons/submit`

**New Request Body Field:**
```json
{
  "eventType": "Codeathon",  // NEW: 'Hackathon' or 'Codeathon'
  "hackathonTitle": "Google Code Jam 2024",
  "organization": "Google",
  // ... other fields
}
```

**Response:**
```json
{
  "message": "Hackathon submitted successfully",
  "hackathon": {
    "_id": "...",
    "eventType": "Codeathon",  // NEW
    "hackathonTitle": "Google Code Jam 2024",
    // ... other fields
  }
}
```

---

## Notes

1. **Naming Convention**: The field is still called `hackathonTitle` in the database for backward compatibility, but displays as "{EventType} Title" in the UI

2. **Credits System**: Codeathons follow the same credit calculation as Hackathons:
   - Winner: 3 points
   - Runner-up: 2 points
   - Participation: 1 point

3. **Approval Process**: Same workflow for both event types (Student → Proctor → Admin)

4. **Autocomplete**: Suggestions work across all event types (shows both hackathons and codeathons)

---

## Implementation Date
December 7, 2024

## Status
  **Completed** - Codeathon support fully implemented
⏳ **Pending** - Conference support (to be added later)
