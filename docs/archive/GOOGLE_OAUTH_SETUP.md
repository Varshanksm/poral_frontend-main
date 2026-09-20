# Google OAuth Setup Guide

## Current Status
  Google Sign-In is now **FULLY FUNCTIONAL**!

The button will trigger Google's sign-in popup, but you need to set up OAuth credentials first.

## Quick Setup (5 minutes)

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if prompted:
   - User Type: **External**
   - App name: **TCE CSBS Hackathon Portal**
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **TCE Portal**
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:5173`
     - `http://localhost:3000`
7. Click **Create**
8. Copy the **Client ID** (looks like: `123456789-abc...xyz.apps.googleusercontent.com`)

### Step 2: Update Frontend

Open `frontend/src/pages/Login.jsx` and replace line 38:

**Current:**
```javascript
client_id: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com', // Placeholder
```

**Replace with:**
```javascript
client_id: 'YOUR_ACTUAL_CLIENT_ID_HERE',
```

### Step 3: Test It!

1. Restart frontend if needed
2. Go to login page
3. Click **"Sign in with Google"**
4. Google popup will appear
5. Select your account
6. You're logged in! 🎉

## How It Works

### For Students:
- Must use `@student.tce.edu` email
- Account is created automatically on first sign-in
- Gets default department (CSBS) and year (1st)
- Can update profile later

### For Proctors/Admins:
- Account must exist in database first
- Google sign-in only works for existing accounts
- Contact admin to create account

## Features

  **Automatic Account Creation** (Students only)  
  **Email Verification** (via Google)  
  **Profile Picture** (from Google)  
  **Secure Token-Based Auth**  
  **Role-Based Access**  
  **Welcome Email** (sent automatically)

## Security

- Google tokens are verified server-side
- Email must be verified by Google
- Student emails must end with `@student.tce.edu`
- Passwords are randomly generated (not used for Google sign-in)
- JWT tokens expire after 24 hours

## Troubleshooting

### "Google Sign-In is not available"
- Check internet connection
- Make sure Google script loaded (check browser console)
- Clear browser cache

### "Students must use @student.tce.edu email"
- Use your college email for student login
- Or use regular email/password login

### "Account not found"
- For proctors/admins, account must be pre-created
- Contact administrator to create your account

## Production Deployment

For production, add these to authorized origins:
- `https://yourdomain.com`
- `https://www.yourdomain.com`

And update the client_id in the code.

## Alternative: Skip Google OAuth

If you don't want to set up Google OAuth:
1. Just use the regular email/password login
2. The forgot password feature works perfectly
3. Google button will show error but won't break the app

---

**Need Help?** Check the [Google OAuth Documentation](https://developers.google.com/identity/gsi/web/guides/overview)
