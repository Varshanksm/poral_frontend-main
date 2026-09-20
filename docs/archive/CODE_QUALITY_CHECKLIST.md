# 🛡️ Code Quality Checklist - Prevent Common Issues

## 📋 **Table/List Issues**

###   Before Committing Table Changes:

1. **Count Columns**
   ```javascript
   // Headers
   const headerCount = document.querySelectorAll('thead th').length;
   // Body cells in first row
   const bodyCount = document.querySelectorAll('tbody tr:first-child td').length;
   // Must match!
   console.assert(headerCount === bodyCount, 'Column mismatch!');
   ```

2. **Check colspan**
   - colspan should equal total number of columns
   - Update when adding/removing columns

3. **Verify Export**
   - CSV headers should match table headers
   - CSV data should match table data
   - Test export with actual data

4. **Test Empty State**
   - "No data" message should span all columns
   - Should be centered and visible

---

## 🔄 **State Management Issues**

###   useEffect Dependencies:

```javascript
// ❌ Bad - Missing dependencies
useEffect(() => {
    fetchData(filter, page);
}, []); // Will only run once!

//   Good - All dependencies listed
useEffect(() => {
    fetchData(filter, page);
}, [filter, page]); // Runs when filter or page changes

//   Better - Use useCallback
const fetchData = useCallback(async () => {
    // ... fetch logic
}, [filter, page]);

useEffect(() => {
    fetchData();
}, [fetchData]);
```

###   Avoid Infinite Loops:

```javascript
// ❌ Bad - Creates infinite loop
useEffect(() => {
    setData(processData(data));
}, [data]); // data changes → effect runs → data changes → effect runs...

//   Good - Only run when source changes
useEffect(() => {
    setData(processData(sourceData));
}, [sourceData]); // Only runs when sourceData changes
```

---

## 🎨 **UI/UX Issues**

###   Loading States:

```javascript
// Always show loading state
{loading ? (
    <div>Loading...</div>
) : data.length === 0 ? (
    <div>No data found</div>
) : (
    <div>{/* Render data */}</div>
)}
```

###   Error Handling:

```javascript
// Always handle errors
const [error, setError] = useState('');

try {
    await API.get('/data');
} catch (err) {
    setError(err.message);
    // Show to user!
}

// In JSX:
{error && <div className="error">{error}</div>}
```

###   Empty States:

```javascript
// Helpful empty states
{items.length === 0 && (
    <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '3rem' }}>📭</div>
        <h3>No Items Found</h3>
        <p>Try adjusting your filters or add a new item.</p>
        <button onClick={clearFilters}>Clear Filters</button>
    </div>
)}
```

---

## 🔐 **API/Backend Issues**

###   Always Validate Input:

```javascript
// Backend validation
if (!hackathonIds || !Array.isArray(hackathonIds) || hackathonIds.length === 0) {
    return res.status(400).json({ message: 'Invalid input' });
}

if (!['Accepted', 'Declined'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
}
```

###   Handle Missing Data:

```javascript
// Use optional chaining and defaults
const name = student?.name || 'Unknown';
const count = data?.length || 0;
const value = response?.data?.value ?? 'default';
```

###   Proper Error Responses:

```javascript
try {
    // ... operation
    res.json({ success: true, data });
} catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
        success: false,
        message: error.message,
        // Don't expose stack trace in production!
    });
}
```

---

## 📱 **Responsive Design Issues**

###   Mobile-First:

```javascript
// Use responsive grid
<div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
}}>
```

###   Overflow Handling:

```javascript
// Scrollable tables
<div style={{ overflowX: 'auto' }}>
    <table style={{ minWidth: '800px' }}>
        {/* ... */}
    </table>
</div>
```

---

## 🚀 **Performance Issues**

###   Pagination:

```javascript
// Don't load everything at once
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(20);

// Load only what's needed
const data = await API.get(`/data?page=${page}&limit=${limit}`);
```

###   Debounce Search:

```javascript
import { useCallback } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useCallback(
    debounce((query) => {
        fetchResults(query);
    }, 300),
    []
);
```

###   Memoization:

```javascript
import { useMemo, useCallback } from 'react';

// Expensive calculations
const filteredData = useMemo(() => {
    return data.filter(item => item.status === filter);
}, [data, filter]);

// Functions passed as props
const handleClick = useCallback(() => {
    doSomething(id);
}, [id]);
```

---

## 🧪 **Testing Checklist**

### Before Pushing Code:

- [ ] **Visual Test** - Does it look right?
- [ ] **Functional Test** - Does it work?
- [ ] **Edge Cases** - Empty data, errors, loading
- [ ] **Mobile Test** - Responsive on small screens?
- [ ] **Browser Test** - Works in Chrome, Firefox, Safari?
- [ ] **Performance** - Fast enough?
- [ ] **Accessibility** - Screen reader friendly?

### Specific Tests:

#### Tables:
- [ ] Headers align with data
- [ ] All columns visible
- [ ] Empty state works
- [ ] Export works
- [ ] Sorting works (if applicable)
- [ ] Filtering works

#### Forms:
- [ ] Validation works
- [ ] Error messages show
- [ ] Success messages show
- [ ] Required fields enforced
- [ ] Submit button disabled during submission

#### Lists:
- [ ] Pagination works
- [ ] Filters work
- [ ] Search works
- [ ] Empty state shows
- [ ] Loading state shows

---

## 🔍 **Code Review Checklist**

### Self-Review Before PR:

1. **No Console Logs**
   ```javascript
   // Remove before commit
   console.log('debug:', data); // ❌
   ```

2. **No Commented Code**
   ```javascript
   // Remove old code
   // const oldFunction = () => { ... }; // ❌
   ```

3. **Consistent Naming**
   ```javascript
   // ❌ Inconsistent
   const user_name = 'John';
   const UserAge = 25;
   
   //   Consistent
   const userName = 'John';
   const userAge = 25;
   ```

4. **Proper Comments**
   ```javascript
   // ❌ Bad comment
   // This function does stuff
   
   //   Good comment
   // Calculates total credits based on attendance and achievement
   // Returns 0 for non-attendance, 1-3 for participation/runner-up/winner
   ```

5. **Error Handling**
   ```javascript
   // ❌ No error handling
   const data = await API.get('/data');
   
   //   With error handling
   try {
       const data = await API.get('/data');
   } catch (error) {
       setError(error.message);
   }
   ```

---

## 📝 **Common Mistakes to Avoid**

### 1. **Forgetting to Clear State**
```javascript
// ❌ Bad
const handleClose = () => {
    setShowModal(false);
    // Forgot to clear form!
};

//   Good
const handleClose = () => {
    setShowModal(false);
    setFormData({});
    setError('');
};
```

### 2. **Not Handling Loading**
```javascript
// ❌ Bad - Shows nothing while loading
return <div>{data.map(...)}</div>;

//   Good - Shows loading state
if (loading) return <div>Loading...</div>;
return <div>{data.map(...)}</div>;
```

### 3. **Hardcoded Values**
```javascript
// ❌ Bad
const API_URL = 'http://localhost:5000';

//   Good
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### 4. **Not Using Keys in Lists**
```javascript
// ❌ Bad
{items.map(item => <div>{item.name}</div>)}

//   Good
{items.map(item => <div key={item.id}>{item.name}</div>)}
```

### 5. **Mutating State Directly**
```javascript
// ❌ Bad
items.push(newItem);
setItems(items);

//   Good
setItems([...items, newItem]);
```

---

## 🎯 **Quick Reference**

### When Adding a Feature:

1.   Plan the UI/UX
2.   Write the backend API
3.   Test the API (Postman/Thunder Client)
4.   Write the frontend
5.   Add loading states
6.   Add error handling
7.   Add empty states
8.   Test all scenarios
9.   Check mobile responsiveness
10.   Review and clean up code

### When Fixing a Bug:

1.   Reproduce the bug
2.   Identify the root cause
3.   Fix the issue
4.   Test the fix
5.   Test related features
6.   Document the fix
7.   Add prevention measures

---

## 🏆 **Best Practices**

1. **DRY** - Don't Repeat Yourself
2. **KISS** - Keep It Simple, Stupid
3. **YAGNI** - You Aren't Gonna Need It
4. **Fail Fast** - Validate early, fail early
5. **Progressive Enhancement** - Start simple, add features
6. **Mobile First** - Design for mobile, enhance for desktop
7. **Accessibility First** - Make it usable for everyone

---

## 📚 **Resources**

- React Docs: https://react.dev
- MDN Web Docs: https://developer.mozilla.org
- JavaScript Info: https://javascript.info
- Web.dev: https://web.dev

---

**Remember:** Good code is code that works, is maintainable, and is easy to understand. 

**Quality > Speed** ✨
