# 🤖 CodeReview AI Agent

[![GitHub](https://img.shields.io/badge/GitHub-Code--Review-blue?logo=github)](https://github.com/arjun188546/Code-Review)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-20%2B-brightgreen?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Convex](https://img.shields.io/badge/Database-Convex-orange)](https://convex.dev)

An intelligent AI-powered code review and debugging platform with multi-provider AI support, GitHub OAuth integration, and comprehensive analytics dashboard.

## 🚀 Features

### Code Review
- **Multi-AI Analysis** - Supports OpenAI GPT-4 Turbo, Claude 3.5 Sonnet, and Gemini 2.5 Flash
- **Automated PR Reviews** - AI-powered analysis of pull requests with inline comments
- **Severity Classification** - Issues categorized as CRITICAL, HIGH, MEDIUM, or LOW
- **Pattern Detection** - Identifies bugs, security vulnerabilities, performance bottlenecks, and code quality issues

### Smart Debugging
- **4-Stage Debug Workflow** - Input → Generating → Ready → History
- **Batch Issue Processing** - Analyze multiple files and issues simultaneously
- **AI-Generated Fixes** - Automatic code fix generation with detailed explanations
- **GitHub Push Integration** - Direct push of fixes to repository branches
- **Debug History** - Track all debug sessions with expandable fix details

### Dashboard & Analytics
- **Real-time Metrics** - Total reviews, repositories, issues detected, and analysis time
- **Visual Analytics** - Activity graphs, severity distribution, and issue type breakdowns
- **Repository Management** - Track and configure multiple repositories
- **Activity Feed** - Live updates on all code review activities

### Authentication & Security
- **GitHub OAuth** - Seamless login with GitHub accounts
- **Interactive Login UI** - Cursor-following animations with floating particles
- **Secure Token Management** - Encrypted storage of GitHub access tokens
- **Logout Functionality** - Complete session cleanup with visual confirmation

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- Convex (Real-time database with 11 tables)
- Octokit (GitHub API integration)
- Multi-AI Support:
  - OpenAI GPT-4 Turbo (via `openai` package)
  - Claude 3.5 Sonnet (via `@anthropic-ai/sdk`)
  - Gemini 2.5 Flash (via `@google/generative-ai`)

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS (Dark theme: #0a0a0a background, #84cc16 lime accents)
- TanStack Query (React Query) for data fetching
- React Router DOM for navigation
- Framer Motion for animations
- Lucide React icons

**Database (Convex):**
- `users` - User profiles with GitHub data
- `repositories` - Tracked GitHub repositories
- `pullRequests` - PR metadata and analysis
- `reviews` - Code review records
- `issues` - Detected code issues
- `debugSessions` - Debug workflow tracking
- `debugFixes` - Generated code fixes
- `activities` - Audit trail
- `settings` - User preferences
- `webhooks` - Webhook configurations
- `apiUsage` - API call tracking

## 📦 Installation & Setup

### Prerequisites

- **Node.js 20+** and npm
- **GitHub Account** (for OAuth authentication)
- **Convex Account** (free tier available at [convex.dev](https://convex.dev))
- **AI Provider API Keys** (choose at least one):
  - OpenAI API Key (GPT-4 Turbo)
  - Anthropic API Key (Claude 3.5 Sonnet)
  - Google AI API Key (Gemini 2.5 Flash)

### Step 1: Clone Repository

```bash
git clone https://github.com/arjun188546/Code-Review.git
cd Code-Review
```

### Step 2: Install Dependencies

**Root (Convex schema):**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 3: Configure Environment Variables

**Backend (.env):**
Create `backend/.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Convex Configuration
CONVEX_DEPLOYMENT=your-convex-deployment-url
CONVEX_DEPLOY_KEY=your-convex-deploy-key

# GitHub OAuth (create at https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback

# AI Provider Keys (at least one required)
OPENAI_API_KEY=sk-your_openai_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
GOOGLE_AI_API_KEY=your_google_ai_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

**Convex (.env.local):**
Create `.env.local` in root:
```env
CONVEX_DEPLOYMENT=your-convex-deployment-url
```

### Step 4: Set Up Convex Database

```bash
# Login to Convex
npx convex login

# Initialize Convex project
npx convex init

# Deploy schema and functions
npx convex dev
```

This will create all 11 database tables automatically.

### Step 5: Configure GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in details:
   - **Application name:** CodeReview AI
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `http://localhost:5173/auth/callback`
4. Copy **Client ID** and **Client Secret** to your `.env` files

### Step 6: Run the Application

Open 3 terminals:

**Terminal 1 - Convex:**
```bash
npx convex dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

Access the app at `http://localhost:5173`

## ⚙️ Configuration

### GitHub Repository Setup

1. **Login** with your GitHub account
2. Navigate to **Repositories** tab
3. Click **"Add Repository"**
4. Select repositories to track
5. Configure webhook URL (for production)

### AI Provider Selection

1. Go to **Settings** tab
2. Choose your preferred AI provider:
   - **OpenAI GPT-4 Turbo** - Best for complex code analysis
   - **Claude 3.5 Sonnet** - Excellent reasoning and context
   - **Gemini 2.5 Flash** - Fast and cost-effective
3. The selected provider will be used for all code reviews and debugging

### Webhook Configuration (Production)

For automatic PR reviews in production:

1. Go to repository → Settings → Webhooks → Add webhook
2. **Payload URL:** `https://your-domain.com/api/webhook`
3. **Content type:** `application/json`
4. **Secret:** Generate a secure secret and add to backend `.env` as `GITHUB_WEBHOOK_SECRET`
5. **Events:** Select "Pull requests" and "Issues"
6. Click "Add webhook"

## 🎨 UI Features & Navigation

### Pages

1. **Dashboard** (`/`)
   - Key metrics: Total reviews, repositories, issues detected, avg analysis time
   - Recent activity timeline
   - Quick actions and repository overview

2. **Repositories** (`/repositories`)
   - List all tracked GitHub repositories
   - Add/remove repositories
   - View repository-specific analytics
   - Configure per-repo settings

3. **Reviews** (`/reviews`)
   - Browse all code reviews with filtering
   - View review details with expandable issues
   - Status indicators (Pending, Completed, Critical)
   - Search and sort functionality

4. **Debug** (`/debug`)
   - **Input Tab:** Select files and issues to debug
   - **Generating Tab:** Real-time AI fix generation progress
   - **Ready Tab:** View generated fixes with syntax highlighting
   - **History Tab:** Access past debug sessions with push status

5. **Analytics** (`/analytics`)
   - Visual charts: Activity trends, severity distribution
   - Issue type breakdown (Bug, Security, Performance, Code Quality)
   - Time-based analysis graphs

6. **Activity** (`/activity`)
   - Real-time feed of all review activities
   - Filterable by type (Review, Issue, Debug)
   - Detailed event logs

7. **Settings** (`/settings`)
   - Select default AI provider
   - Manage API keys
   - GitHub OAuth status
   - User preferences

8. **Login** (`/login`)
   - Interactive cursor-following animations
   - GitHub OAuth integration
   - Floating particles effect

9. **Logout** (`/logout`)
   - Session cleanup confirmation
   - Animated logout experience

### Design System

**Color Palette:**
- Background: `#0a0a0a` (Pure black)
- Cards: `#1a1a1a` (Dark gray)
- Accent: `#84cc16` (Lime green)
- Borders: `#2a2a2a` (Subtle divider)
- Text: `#ffffff` (White), `#a3a3a3` (Gray)

### Authentication
- `POST /api/auth/github` - GitHub OAuth callback handler
- `GET /api/auth/user` - Get current user info

### Repositories
- `GET /api/repositories` - List all repositories
- `GET /api/repositories/:id` - Get repository details
- `POST /api/repositories` - Add new repository
### Common Issues

**1. Backend not starting:**
- ✅ Verify `.env` file exists in `backend/` directory
- ✅ Check all required environment variables are set
- ✅ Ensure Convex deployment URL is correct
- ✅ Run `npm install` in backend folder

**2. Frontend not connecting to backend:**
- ✅ Check `VITE_API_URL` in `frontend/.env` points to `http://localhost:3001`
- ✅ Ensure backend is running on port 3001
- ✅ Check browser console for CORS errors
- ✅ Verify `FRONTEND_URL` in backend `.env` matches frontend URL

**3. Convex database errors:**
- ✅ Run `npx convex dev` in root directory
- ✅ Check `.env.local` has correct `CONVEX_DEPLOYMENT`
- ✅ Verify you're logged in: `npx convex login`
- ✅ Clear Convex cache: delete `.convex` folder and restart

**4. GitHub OAuth not working:**
- ✅ Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
- ✅ Check callback URL in GitHub OAuth app matches `GITHUB_REDIRECT_URI`
- ✅ Ensure redirect URI is exactly `http://localhost:5173/auth/callback`
- ✅ Try regenerating Client Secret in GitHub settings

**5. AI analysis failing:**
- ✅ Verify at least one AI provider API key is valid
- ✅ Check API key format (OpenAI: `sk-`, Anthropic: `sk-ant-`, Google: varies)
- ✅ Test API keys with a simple request
- ✅ Check API rate limits and billing status
- ✅ Review backend console for detailed error messages

**6. Debug fixes not generating:**
- ✅ Ensure selected AI provider is configured
- ✅ Check backend logs for AI API errors
- ✅ Verify files are properly loaded in Input tab
- ✅ Try switching to a different AI provider in Settings

**7. GitHub push failing:**
- ✅ Verify GitHub OAuth token has `repo` scope
- ✅ Check repository permissions (must have write access)
- ✅ Ensure branch name doesn't already exist
- ✅ Review backend logs for Octokit errors

### Getting Help

- 📖 Check existing documentation files:
  - `CONVEX_SETUP.md` - Convex configuration
  - `GITHUB_SETUP.md` - GitHub integration
  - `OAUTH_SETUP.md` - OAuth authentication
  
- 🐛 Enable debug logging:
  ```bash
  # Backend
  NODE_ENV=development npm run dev
  
  # Frontend (check browser console)
  ```

- 📝 Check logs:
  - Backend: Console output in terminal
  - Frontend: Browser DevTools Console
  - Convex: Dashboard logs at convex.dev
- `POST /api/debug` - Start debug session and generate fixes
- `POST /api/debug/push` - Push fixes to GitHub
- `GET /api/debug/sessions/:userId` - Get user's debug sessions
- `GET /api/debug/sessions/:sessionId/fixes` - Get fixes for session

### Analytics
- `GET /api/analytics/stats` - Get dashboard statistics
- `GET /api/analytics/activity` - Get activity timeline
- `GET /api/analytics/charts` - Get chart data

### Webhooks
- `POST /api/webhook` - GitHub webhook receiver (PR events)
- Progress indicators with animation
� Deployment

### Production Deployment

**Backend (Railway/Render/Heroku):**
1. Set all environment variables in hosting platform
2. Ensure `NODE_ENV=production`
3. Update `FRONTEND_URL` to production URL
4. Update `GITHUB_REDIRECT_URI` to production callback

**Frontend (Vercel/Netlify):**
1. Build command: `npm run build`
2. Output directory: `dist`
3. Set `VITE_API_URL` to backend production URL
4. Set `VITE_GITHUB_CLIENT_ID` to GitHub OAuth client ID

**Convex:**
- Automatically deploys with `npx convex deploy`
- Update `CONVEX_DEPLOYMENT` to production URL

### GitHub OAuth Update

Update your GitHub OAuth app URLs:
- **Homepage URL:** `https://your-domain.com`
- **Callback URL:** `https://your-domain.com/auth/callback`

## 📁 Project Structure

```
code-review-ai/
├── backend/                 # Express + TypeScript backend
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── services/       # Business logic (AI, GitHub)
│   │   ├── routes/         # API routes
│   │   └── server.ts       # Entry point
│   ├── .env               # Backend environment variables
│   └── package.json
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Route pages
│   │   ├── context/       # React Context (Auth, Debug)
│   │   └── App.tsx        # Main app component
│   ├── .env              # Frontend environment variables
│   └── package.json
├── convex/                # Convex schema and functions
│   ├── schema.ts         # Database schema (11 tables)
│   └── *.ts              # Query/mutation functions
├── .env.local            # Convex deployment URL
└── package.json          # Root package (Convex)
```

## 🎯 Use Cases

1. **Automated PR Reviews**
   - Connect repositories via GitHub OAuth
   - Set up webhooks for automatic reviews
   - AI analyzes PRs and posts inline comments

2. **Bug Detection & Fixing**
   - Select files with issues
   - AI generates fixes with explanations
   - Push fixes directly to GitHub branches

3. **Code Quality Monitoring**
   - Track code quality trends over time
   - Identify recurring issue patterns
   - Monitor team productivity metrics

4. **Security Auditing**
   - Detect security vulnerabilities automatically
   - Get fix recommendations
   - Track remediation progress

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🤝 Contributing

Contributions welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with the **ANTIGRAVITY PROMPT** framework for rapid AI application development
- UI inspired by modern dark-themed analytics dashboards
- Multi-AI integration for flexible provider selection
- Real-time updates powered by Convex

## 📧 Contact

**Developer:** Arjun  
**GitHub:** [@arjun188546](https://github.com/arjun188546)  
**Repository:** [Code-Review](https://github.com/arjun188546/Code-Review)

---

**Made with ❤️ using AI-powered development**

⭐ Star this repo if you find it helpful!
**Debug History:**
- All debug sessions with timestamps
- Generated fixes per session
- GitHub push status tracking
- Session outcome (Success/Failed)

## 🔒 Security

- Webhook signature verification
- Secure API key storage
- Environment variable configuration
- No sensitive data in logs

## 🧪 Testing

Create test PRs with these examples:

**Bug Detection:**
```javascript
function divide(a, b) {
  return a / b; // Missing zero check
}
```

**Security Issue:**
```javascript
const query = `SELECT * FROM users WHERE id = ${req.query.id}`; // SQL injection
```

**Performance Issue:**
```javascript
// O(n²) complexity - should use Set
for (let i = 0; i < arr.length; i++) {
  for (let j = i + 1; j < arr.length; j++) {
    // nested loop
  }
}
```

## 📝 API Endpoints

- `POST /webhook` - GitHub webhook receiver
- `GET /api/reviews` - Get all reviews
- `GET /api/reviews/:id` - Get specific review
- `GET /api/stats` - Get analytics stats
- `GET /api/repositories` - Get tracked repositories

## 🐛 Troubleshooting

**Backend not starting:**
- Check DATABASE_URL is correct
- Ensure Redis is running
- Verify API keys are valid

**Webhook not receiving events:**
- Check webhook URL is publicly accessible (use ngrok for local testing)
- Verify webhook secret matches
- Check GitHub webhook delivery logs

**AI analysis failing:**
- Verify OpenAI/Anthropic API keys
- Check API rate limits
- Review logs for detailed errors

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 🙏 Acknowledgments

Built with the ANTIGRAVITY PROMPT framework for rapid AI application development.

---

**Made with ❤️ using AI-powered development**
