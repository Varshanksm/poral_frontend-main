# 🔧 Fix Google Sign-In CORS Error

## The Error You're Seeing:
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

## What This Means:
Your Google Client ID is valid, but Google doesn't recognize `http://localhost:5173` as an authorized origin.

##   SOLUTION - Add Authorized Origins

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Credentials**

### Step 2: Edit Your OAuth 2.0 Client ID
1. Find your Client ID: `495523531422-hqolcs7uvu6dq5ca6c21ppe2v72afh97.apps.googleusercontent.com`
2. Click the **Edit** button (pencil icon)

### Step 3: Add Authorized JavaScript Origins
In the **Authorized JavaScript origins** section, add these EXACT URLs:

```
http://localhost:5173
http://127.0.0.1:5173
http://localhost:3000
http://127.0.0.1:3000
```

**IMPORTANT:** 
- Use `http://` NOT `https://`
- Include the port number `:5173`
- No trailing slash `/`

### Step 4: Add Authorized Redirect URIs
In the **Authorized redirect URIs** section, add:

```
http://localhost:5173
http://127.0.0.1:5173
http://localhost:3000
http://127.0.0.1:3000
```

### Step 5: Save Changes
1. Click **SAVE** at the bottom
2. Wait 5-10 seconds for changes to propagate
3. **Refresh your browser** (Ctrl+Shift+R for hard refresh)

## 🧪 After Saving, Test Again:

1. **Hard refresh** your browser (Ctrl+Shift+R)
2. Click "Sign in with Google"
3. Google popup should work!
4. Sign in with your account
5. Success! 🎉

##   Common Mistakes to Avoid:

❌ **Wrong:** `https://localhost:5173` (don't use https)
❌ **Wrong:** `http://localhost:5173/` (no trailing slash)
❌ **Wrong:** `http://localhost` (must include port)
❌ **Wrong:** `localhost:5173` (must include http://)

  **Correct:** `http://localhost:5173`

## 📸 Visual Guide:

Your Google Cloud Console should look like this:

**Authorized JavaScript origins:**
```
http://localhost:5173
http://127.0.0.1:5173
```

**Authorized redirect URIs:**
```
http://localhost:5173
http://127.0.0.1:5173
```

## 🔍 Verify It's Working:

After saving and refreshing:
1. Open browser console (F12)
2. Click "Sign in with Google"
3. You should see:
   -   "Google Sign-In initialized successfully"
   -   Google popup appears
   -   No CORS errors

## 🆘 Still Not Working?

### Check These:
1. **Saved changes?** Make sure you clicked SAVE in Google Console
2. **Hard refresh?** Press Ctrl+Shift+R (not just F5)
3. **Correct Client ID?** Verify it matches in Login.jsx line 38
4. **Wait time?** Sometimes takes 30 seconds for Google to update

### Clear Browser Cache:
1. Press Ctrl+Shift+Delete
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page

## 📝 Quick Checklist:

- [ ] Opened Google Cloud Console
- [ ] Found OAuth 2.0 Client ID
- [ ] Added `http://localhost:5173` to JavaScript origins
- [ ] Added `http://localhost:5173` to redirect URIs
- [ ] Clicked SAVE
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Tested Google Sign-In button

---

## 🎯 Expected Result:

After completing these steps:
-   No CORS errors
-   Google popup appears
-   Can select Google account
-   Successfully logs in
-   Redirects to dashboard

**This will fix the issue 100%!** The error is just a configuration issue, not a code problem.
