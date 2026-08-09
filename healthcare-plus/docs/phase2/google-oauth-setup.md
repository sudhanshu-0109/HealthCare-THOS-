# Google OAuth 2.0 Setup Guide for healthcare+

This guide explains how to set up Google OAuth 2.0 credentials for local development and production.

---

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown at the top of the page and select **New Project**.
3. Enter Project Name: `healthcare-plus-dev` and click **Create**.

---

## Step 2: Configure OAuth Consent Screen

1. In the left navigation menu, go to **APIs & Services** → **OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the required fields:
   - **App name:** `healthcare+`
   - **User support email:** Select your email address
   - **Developer contact information:** Enter your email address
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes**, select:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Click **Save and Continue**.
7. Under **Test users**, add your own Google email address for testing in development.
8. Click **Save and Continue**.

---

## Step 3: Create OAuth 2.0 Client Credentials

1. Go to **APIs & Services** → **Credentials**.
2. Click **+ Create Credentials** → **OAuth client ID**.
3. Select Application type: **Web application**.
4. Set Name: `healthcare+ Web Client`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - `http://localhost:5000`
6. Under **Authorized redirect URIs** (optional for `@react-oauth/google` popup flow, but good to add):
   - `http://localhost:5173`
7. Click **Create**.

---

## Step 4: Add Credentials to Environment Variables

Copy the generated **Client ID** and **Client Secret** into your `.env` files:

### Frontend Environment (`frontend/.env`)
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Backend Environment (`backend/.env`)
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## Step 5: How Google OAuth Works in healthcare+

1. **Client Side:** `@react-oauth/google` renders the Google Sign-In button. When clicked, it opens Google's secure authentication dialog and returns an `idToken`.
2. **Server Verification:** Frontend sends `idToken` to `POST /api/auth/google`. Backend verifies `idToken` signature directly with Google using `google-auth-library`.
3. **Account Resolution:**
   - Existing Google User (`googleId` matches): Logged in immediately.
   - Existing Local Email User (`email` matches): Google ID linked (`authProvider = BOTH`), email verified, logged in.
   - New User: Created automatically (`authProvider = GOOGLE`, `isEmailVerified = true`), logged in.
