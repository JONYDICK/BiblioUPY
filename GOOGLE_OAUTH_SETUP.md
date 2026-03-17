# Google OAuth Setup Guide

## What's Been Implemented

The BiblioUPY application now supports Google OAuth authentication, allowing users to sign in with their Gmail credentials. Here's what has been added:

### Backend Changes:
1. **`backend/src/auth.ts`** - Added Google OAuth strategy using `passport-google-oauth20`
2. **`backend/src/routes.ts`** - Added two new routes:
   - `GET /api/auth/google` - Initiates Google login
   - `GET /api/auth/google/callback` - Handles Google OAuth callback
3. **`shared/schema.ts`** - Added `googleId` field to users table
4. **Database** - Added `google_id` column to users table

### How It Works:
1. User clicks "Sign in with Google" button
2. User is redirected to Google login page
3. After authentication, Google redirects back to the callback URL
4. If user exists (by email), they're logged in
5. If user is new, a new account is automatically created with:
   - Email from Google profile
   - Name from Google profile
   - Avatar from Google profile
   - Automatically assigned "student" role
   - No password (OAuth-only account)

## Setup Steps

### Step 1: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Set authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
7. Copy the **Client ID** and **Client Secret**

### Step 2: Add Environment Variables

Edit `.env` file and add:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

Replace:
- `your_client_id_here` with your Google Client ID
- `your_client_secret_here` with your Google Client Secret
- The callback URL should match what you set in Google Cloud Console

### Step 3: Update Frontend (When Ready)

Create a "Sign in with Google" button in your login form:

```html
<a href="/api/auth/google" class="btn btn-google">
  Sign in with Google
</a>
```

Or use a library like `@react-oauth/google` for a more integrated experience.

### Step 4: Test

1. Start the development server: `npm run dev`
2. Navigate to the application
3. Click the "Sign in with Google" button
4. Complete Google authentication
5. You should be logged in and redirected to the home page

## Security Notes

⚠️ **DO NOT commit your credentials to git!**

- Keep `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` (which should be in `.gitignore`)
- Use environment-specific credentials for development/production
- The callback URL must be HTTPS in production
- Users logging in via Google will have empty passwords and cannot use password-based login

## Troubleshooting

### "Google profile sin email"
- The Google account doesn't have an email associated
- Use a different Google account

### "Rol 'student' no configurado"
- The default roles haven't been created in the database
- Run the application once to seed the roles, or manually check database

### Callback URL mismatch error
- Verify the callback URL in `.env` matches exactly what's configured in Google Cloud Console
- Remember to include the protocol (`http://` or `https://`) and port number

### Port already in use
- Change PORT in `.env` to an available port
- Default is 3000

## Files Modified

- ✅ `backend/src/auth.ts` - Added Google strategy
- ✅ `backend/src/routes.ts` - Added OAuth routes
- ✅ `shared/schema.ts` - Added googleId field
- ✅ `.env` - Added Google OAuth variables
- ✅ Database - Added google_id column to users table
- ✅ `package.json` - Added `passport-google-oauth20` package

## Next Steps

1. Get Google OAuth credentials from Google Cloud Console
2. Add credentials to `.env`
3. Update frontend UI with "Sign in with Google" button
4. Test the flow from your application
5. Deploy to production with updated callback URL

Happy authenticating! 🎉
