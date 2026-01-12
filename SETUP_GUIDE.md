# 🚀 Quick Setup Guide

This guide will help you set up CodeReview AI Agent on your local machine in under 10 minutes.

## Prerequisites Checklist

Before starting, make sure you have:

- [ ] Node.js 20+ installed ([Download](https://nodejs.org/))
- [ ] Git installed ([Download](https://git-scm.com/))
- [ ] A GitHub account ([Sign up](https://github.com/join))
- [ ] A Convex account ([Sign up](https://convex.dev))
- [ ] At least one AI API key:
  - [ ] OpenAI API Key ([Get here](https://platform.openai.com/api-keys))
  - [ ] Anthropic API Key ([Get here](https://console.anthropic.com/))
  - [ ] Google AI API Key ([Get here](https://makersuite.google.com/app/apikey))

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/arjun188546/Code-Review.git
cd Code-Review
```

### 2. Install Dependencies

```bash
# Install root dependencies (Convex)
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Set Up Convex Database

```bash
# Login to Convex (will open browser)
npx convex login

# Initialize Convex project
npx convex init

# This will prompt you to:
# - Create a new project or select existing
# - Choose a project name (e.g., "codereview-ai")
# - Confirm the setup

# The initialization will automatically:
# ✅ Create .env.local with your deployment URL
# ✅ Generate Convex functions
# ✅ Set up the database schema
```

### 4. Configure GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the form:
   ```
   Application name: CodeReview AI (Local)
   Homepage URL: http://localhost:5173
   Authorization callback URL: http://localhost:5173/auth/callback
   ```
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy it

### 5. Configure Environment Variables

#### Backend Environment (.env)

Create `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Convex Configuration (get from .env.local in root)
CONVEX_DEPLOYMENT=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=prod:your-project-key

# GitHub OAuth (from step 4)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback

# AI Provider Keys (at least one required)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...

# Get from: https://makersuite.google.com/app/apikey
GOOGLE_AI_API_KEY=AIza...

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### Frontend Environment (.env)

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
```

#### Root Environment (.env.local)

This is auto-created by `npx convex init`, but verify it contains:

```env
CONVEX_DEPLOYMENT=https://your-project.convex.cloud
```

### 6. Run the Application

Open **3 separate terminals**:

#### Terminal 1: Start Convex

```bash
npx convex dev
```

Wait for: `✔ Convex functions ready!`

#### Terminal 2: Start Backend

```bash
cd backend
npm run dev
```

Wait for: `🚀 Server running on port 3001`

#### Terminal 3: Start Frontend

```bash
cd frontend
npm run dev
```

Wait for: `Local: http://localhost:5173/`

### 7. Access the Application

1. Open your browser and go to: **http://localhost:5173**
2. Click **"Sign in with GitHub"**
3. Authorize the application
4. You'll be redirected to the Dashboard

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Frontend loads at http://localhost:5173
- [ ] Backend is running on port 3001
- [ ] Convex dev is running and shows "ready"
- [ ] You can login with GitHub
- [ ] Dashboard displays your GitHub username
- [ ] You can navigate to Settings and see your AI provider

## 🎯 First Steps After Setup

1. **Add a Repository**
   - Go to Repositories tab
   - Click "Add Repository"
   - Select a GitHub repository to track

2. **Configure AI Provider**
   - Go to Settings tab
   - Choose your preferred AI (OpenAI, Claude, or Gemini)
   - The selection is auto-saved

3. **Test Debug Feature**
   - Go to Debug tab
   - Select a repository and file
   - Click "Analyze Issues"
   - View AI-generated fixes

## 🐛 Common Issues & Solutions

### Issue: "CONVEX_DEPLOYMENT not found"
**Solution:** Run `npx convex init` first, it creates `.env.local`

### Issue: "GitHub OAuth not working"
**Solution:** 
- Verify callback URL is exactly: `http://localhost:5173/auth/callback`
- Check Client ID matches in both backend/.env and frontend/.env
- Try regenerating Client Secret

### Issue: "Port 3001 already in use"
**Solution:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### Issue: "AI API not working"
**Solution:**
- Verify API key format (OpenAI: `sk-`, Anthropic: `sk-ant-`)
- Check API key has billing enabled
- Try switching to a different AI provider in Settings

### Issue: "Cannot connect to backend"
**Solution:**
- Ensure backend is running: `cd backend && npm run dev`
- Check `VITE_API_URL=http://localhost:3001` in frontend/.env
- Verify no firewall blocking port 3001

## 📚 Additional Resources

- **Full README:** [README.md](README.md) - Comprehensive documentation
- **Convex Setup:** [CONVEX_SETUP.md](CONVEX_SETUP.md) - Database configuration
- **GitHub Setup:** [GITHUB_SETUP.md](GITHUB_SETUP.md) - GitHub integration
- **OAuth Setup:** [OAUTH_SETUP.md](OAUTH_SETUP.md) - Authentication guide

## 🎓 Video Tutorial

Coming soon: Step-by-step video walkthrough!

## 💬 Need Help?

- Open an issue on GitHub
- Check existing documentation files
- Review the troubleshooting section in README.md

## 🌟 Next Steps

Once everything is working:

1. Explore the Analytics dashboard
2. Try the debug workflow with real code
3. Set up webhooks for automatic PR reviews (see README)
4. Customize AI provider preferences
5. Invite team members to collaborate

---

**Setup Time:** ~10 minutes  
**Difficulty:** Beginner-friendly  
**Last Updated:** January 12, 2026  

Made with ❤️ by [@arjun188546](https://github.com/arjun188546)
