# GitHub OAuth App Setup Guide

## Step 1: Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click **"OAuth Apps"** → **"New OAuth App"**

3. Fill in the form:
   ```
   Application name: CodeReview AI Agent
   
   Homepage URL: http://localhost:5173
   
   Application description: AI-powered code review assistant
   
   Authorization callback URL: http://localhost:3000/api/auth/callback
   ```

4. Click **"Register application"**

5. On the next page, you'll see:
   - **Client ID** (copy this)
   - Click **"Generate a new client secret"** → Copy the secret

## Step 2: Update .env File

Add to `backend/.env`:

```env
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

## Step 3: Restart Backend

```powershell
cd D:\codereview\code-review-ai\backend
npm run dev
```

## Step 4: Start Frontend

```powershell
cd D:\codereview\code-review-ai\frontend
npm run dev
```

## Step 5: Login Flow

1. Open http://localhost:5173
2. You'll see the login page
3. Click "Sign in with GitHub"
4. Authorize the app
5. You'll be redirected back with all your repositories!

## Step 6: Enable Code Reviews

1. Browse your repositories
2. Click "Enable Reviews" on any repo
3. Webhook will be automatically installed
4. Create a PR to test!

---

## Features:

✅ **GitHub OAuth Login** - Secure authentication
✅ **View All Repos** - See all your accessible repositories  
✅ **One-Click Install** - Automatically create webhooks
✅ **Search & Filter** - Find repos quickly
✅ **Public/Private** - Support for both repo types
✅ **Organization Repos** - Access org repositories

---

## Production Setup:

For production, update these URLs in GitHub OAuth App settings:

```
Homepage URL: https://yourapp.com
Callback URL: https://yourapp.com/api/auth/callback
```

And update `.env`:
```env
BASE_URL=https://yourapp.com
FRONTEND_URL=https://yourapp.com
```

🚀 **Ready to go!**
