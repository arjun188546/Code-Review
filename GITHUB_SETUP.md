# GitHub Setup Guide for CodeReview AI Agent

## Step 1: Create GitHub Personal Access Token

1. Go to GitHub Settings:
   - Click your profile picture (top right)
   - Select **Settings**
   - Scroll down to **Developer settings** (bottom left)
   - Click **Personal access tokens** → **Tokens (classic)**

2. Generate new token:
   - Click **Generate new token** → **Generate new token (classic)**
   - Name: `CodeReview AI Agent`
   - Expiration: Choose your preference (90 days, 1 year, or no expiration)
   
3. Select scopes (permissions):
   - ✅ **repo** (Full control of private repositories)
     - repo:status
     - repo_deployment
     - public_repo
     - repo:invite
     - security_events
   - ✅ **admin:repo_hook** (Full control of repository hooks)
     - write:repo_hook
     - read:repo_hook

4. Click **Generate token**
5. **COPY THE TOKEN IMMEDIATELY** (you won't be able to see it again!)
   - Format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Configure Environment Variables

Edit `backend/.env` file:

```env
# GitHub Configuration
GITHUB_TOKEN=ghp_your_actual_token_here
GITHUB_WEBHOOK_SECRET=your_random_secret_key_here

# AI API Keys
OPENAI_API_KEY=sk-your_openai_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key

# Database
DATABASE_URL=postgresql://codereview:codereview123@localhost:5432/codereview_ai

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development
```

**Generate a webhook secret:**
```powershell
# Option 1: PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3: Setup Public URL (For Local Development)

Since GitHub needs to send webhooks to your server, you need a public URL.

### Option A: Using ngrok (Recommended for Testing)

1. Install ngrok: https://ngrok.com/download
2. Start your backend server:
   ```powershell
   cd D:\codereview\code-review-ai\backend
   npm run dev
   ```
3. In another terminal, start ngrok:
   ```powershell
   ngrok http 3000
   ```
4. Copy the forwarding URL (e.g., `https://abc123.ngrok.io`)

### Option B: Deploy to Production

Deploy backend to:
- Railway.app
- Render.com
- Heroku
- DigitalOcean
- AWS/Azure/GCP

---

## Step 4: Configure GitHub Webhook

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Webhooks** (left sidebar)
4. Click **Add webhook**

5. Configure webhook:
   ```
   Payload URL: https://your-ngrok-url.ngrok.io/webhook
   (or your production URL: https://yourapp.com/webhook)
   
   Content type: application/json
   
   Secret: [Paste the GITHUB_WEBHOOK_SECRET from your .env file]
   
   SSL verification: Enable SSL verification
   
   Which events would you like to trigger this webhook?
   ○ Let me select individual events
     ✅ Pull requests
     ✅ Pull request reviews (optional)
     ✅ Pull request review comments (optional)
   
   ✅ Active (checked)
   ```

6. Click **Add webhook**

---

## Step 5: Test the Setup

### A. Test Backend is Running

```powershell
# Health check
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-10T..."}
```

### B. Test Webhook Delivery

1. Create a test pull request in your repository:
   ```powershell
   # Create a new branch
   git checkout -b test-codereview-ai
   
   # Make a simple change
   echo "// Test file" > test.js
   git add test.js
   git commit -m "Test CodeReview AI"
   git push origin test-codereview-ai
   ```

2. Go to GitHub and create a PR from `test-codereview-ai` to `main`

3. Check webhook delivery:
   - Go to Settings → Webhooks
   - Click on your webhook
   - Click **Recent Deliveries** tab
   - You should see a delivery with status 200 ✅

4. Check backend logs:
   ```powershell
   # You should see:
   # Queued PR #X from owner/repo for analysis
   ```

### C. Verify AI Review

Within 30-60 seconds, you should see:
- A comment on your PR from the bot
- Analysis with complexity score
- Issues categorized by severity
- Inline comments on specific lines (if issues found)

---

## Step 6: Monitor in Dashboard

1. Start frontend:
   ```powershell
   cd D:\codereview\code-review-ai\frontend
   npm run dev
   ```

2. Open browser: http://localhost:5173

3. You should see:
   - Your review in the Dashboard
   - Stats updating
   - Issues visualized in charts

---

## Troubleshooting

### Webhook not receiving events

**Check 1: Is backend running?**
```powershell
curl http://localhost:3000/health
```

**Check 2: Is ngrok running?**
```powershell
curl https://your-ngrok-url.ngrok.io/health
```

**Check 3: Webhook signature valid?**
- Ensure `GITHUB_WEBHOOK_SECRET` in `.env` matches webhook secret in GitHub

**Check 4: Check GitHub webhook deliveries**
- Settings → Webhooks → Recent Deliveries
- Click on a delivery to see request/response
- Common errors:
  - 401: Invalid signature (secret mismatch)
  - 404: Wrong URL
  - 500: Backend error (check logs)

### AI Analysis Failing

**Check 1: API Keys valid?**
```powershell
# Test OpenAI
curl https://api.openai.com/v1/models -H "Authorization: Bearer $env:OPENAI_API_KEY"

# Test Anthropic  
curl https://api.anthropic.com/v1/messages -H "x-api-key: $env:ANTHROPIC_API_KEY"
```

**Check 2: Check backend logs**
Look for errors in terminal running `npm run dev`

### Database Connection Issues

**Check PostgreSQL running:**
```powershell
docker ps | Select-String postgres
```

**Check connection:**
```powershell
cd backend
npx prisma studio
# Should open Prisma Studio on http://localhost:5555
```

---

## Step 7: Add Multiple Repositories

To monitor multiple repositories:

1. Repeat Step 4 for each repository
2. Use the same webhook URL
3. Use the same webhook secret
4. All reviews will appear in your dashboard

---

## Security Best Practices

✅ **DO:**
- Use strong, random webhook secrets
- Enable SSL verification
- Rotate tokens periodically
- Use environment variables (never commit secrets)
- Use fine-grained permissions when possible

❌ **DON'T:**
- Share your tokens publicly
- Commit `.env` file to git
- Use the same secret for multiple apps
- Disable SSL verification

---

## Production Deployment Checklist

- [ ] Deploy backend to production server
- [ ] Setup PostgreSQL database (managed service recommended)
- [ ] Setup Redis (managed service recommended)
- [ ] Configure environment variables
- [ ] Update GitHub webhook URL to production URL
- [ ] Enable HTTPS (required for GitHub webhooks)
- [ ] Setup monitoring and logging
- [ ] Configure rate limiting
- [ ] Setup backup strategy for database

---

## Next Steps

1. ✅ Setup complete - you're ready to go!
2. Create PRs and watch the AI review them
3. Check the dashboard for analytics
4. Customize review prompts in `backend/src/services/ai.service.ts`
5. Add more repositories

---

**Need Help?**
- Check logs: `backend` terminal for errors
- Test webhook: GitHub Settings → Webhooks → Recent Deliveries
- Verify API keys are working
- Ensure all services (backend, Redis, PostgreSQL) are running

**Happy Code Reviewing! 🤖✨**
