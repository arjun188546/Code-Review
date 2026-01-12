# Convex Setup Guide

## 🚀 Complex Multi-User Convex Architecture

This is a production-ready Convex setup with:

### Features
- ✅ Multi-user authentication with GitHub OAuth
- ✅ Real-time data synchronization
- ✅ Webhook processing queue
- ✅ Activity logging and audit trails
- ✅ Usage tracking and billing metrics
- ✅ Scheduled background jobs (cron)
- ✅ HTTP endpoints for webhooks
- ✅ Rate limiting
- ✅ Comprehensive error handling

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Convex Cloud                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Database   │  │  Real-time   │  │  HTTP Routes │    │
│  │   (Tables)   │  │ Subscriptions│  │  (Webhooks)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Queries    │  │  Mutations   │  │  Cron Jobs   │    │
│  │  (Read-only) │  │   (Writes)   │  │  (Scheduled) │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Secure Connection
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                         │
│                                                             │
│  Frontend (React)  ◄──►  Backend (Express)                 │
│  - useQuery()            - Convex Client                    │
│  - useMutation()         - AI Analysis                      │
│  - Real-time updates     - GitHub Integration               │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

**Users** - GitHub authenticated users
**Repositories** - Connected GitHub repos
**Reviews** - PR code reviews
**Issues** - Code issues found
**Metrics** - Performance tracking
**UserSettings** - Per-user AI preferences
**Activities** - Audit log
**WebhookEvents** - Event queue
**Usage** - Billing/limits tracking

### Setup Instructions

#### 1. Deploy to Convex Cloud

```bash
cd d:\codereview\code-review-ai
npx convex dev
```

This will:
- Open browser for Convex login/signup
- Create a new project
- Deploy your schema and functions
- Provide a deployment URL

#### 2. Configure Environment

Copy the deployment URL to your `.env` files:

```env
# Frontend .env
VITE_CONVEX_URL=https://your-project.convex.cloud

# Backend .env
CONVEX_URL=https://your-project.convex.cloud
```

#### 3. Test Webhook Endpoint

Your webhook URL will be:
```
https://your-project.convex.site/webhook
```

Configure this in GitHub repository settings.

### API Reference

#### Queries (Read-only, Real-time)

```typescript
// Get user reviews with auto-updates
const reviews = useQuery(api.reviews.getUserReviews, {
  userId: currentUser._id,
  status: "completed"
});

// Get review with live updates
const review = useQuery(api.reviews.getReviewWithDetails, {
  reviewId: "..."
});

// Get statistics
const stats = useQuery(api.reviews.getReviewStats, {
  userId: currentUser._id,
  timeRange: "30d"
});
```

#### Mutations (Write operations)

```typescript
// Create review
const createReview = useMutation(api.reviews.createReview);
await createReview({
  userId: "...",
  repositoryId: "...",
  prNumber: 123,
  prTitle: "Fix bug",
  prUrl: "https://...",
  prAuthor: "username",
  baseBranch: "main",
  headBranch: "feature"
});

// Update user settings
const updateSettings = useMutation(api.settings.updateUserSettings);
await updateSettings({
  userId: "...",
  aiProvider: "gemini",
  geminiKey: "AIza..."
});
```

#### HTTP Actions

```bash
# Webhook endpoint
POST https://your-project.convex.site/webhook
Headers:
  X-Hub-Signature-256: sha256=...
  X-GitHub-Event: pull_request
Body: { GitHub webhook payload }

# Health check
GET https://your-project.convex.site/health
```

### Scheduled Functions (Cron Jobs)

- **Every minute**: Process webhook queue
- **Every 5 minutes**: Retry failed reviews
- **Daily 1AM UTC**: Update usage statistics
- **Daily 2AM UTC**: Cleanup old activities

### Multi-User Features

#### Per-User Data Isolation
All queries automatically filter by `userId`:
```typescript
.withIndex("by_user", (q) => q.eq("userId", currentUserId))
```

#### User Settings
Each user can configure:
- AI provider (OpenAI, Claude, Gemini)
- Own API keys
- Webhook secrets
- Notification preferences

#### Activity Logging
All actions tracked per user:
- Review created
- Review completed  
- Issues found
- Settings updated
- Webhooks received

#### Usage Tracking
Monitor per-user:
- Reviews count
- Tokens used
- API calls
- Estimated costs

### Security Features

- ✅ GitHub webhook signature verification
- ✅ Rate limiting (100 req/min per user)
- ✅ User-scoped data access
- ✅ Encrypted API keys
- ✅ Activity audit trail

### Scaling

Convex automatically handles:
- Database indexing and optimization
- Real-time subscription management
- Horizontal scaling
- Backups
- CDN caching

**No DevOps required!**

### Cost Estimation

Free tier includes:
- 1M function calls/month
- 1GB storage
- Unlimited real-time subscriptions

Paid plans start at $15/month for production apps.

### Development Workflow

```bash
# Local development with hot reload
npx convex dev

# View dashboard
open https://dashboard.convex.dev

# View logs
npx convex logs

# Deploy to production
npx convex deploy --prod
```

### Next Steps

1. Run `npx convex dev` to deploy
2. Get your deployment URL
3. Configure GitHub OAuth
4. Update frontend to use Convex hooks
5. Test webhook integration
6. Monitor in Convex dashboard

**Ready to deploy!** 🚀
