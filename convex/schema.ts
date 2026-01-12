import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users with GitHub authentication
  users: defineTable({
    githubId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    accessToken: v.optional(v.string()), // Optional for temporary users
    refreshToken: v.optional(v.string()),
    plan: v.optional(v.string()), // free, pro, enterprise
    lastLoginAt: v.optional(v.number()), // Optional for temporary users
  })
    .index("by_github_id", ["githubId"])
    .index("by_username", ["username"]),

  // GitHub repositories
  repositories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    owner: v.string(),
    fullName: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()), // Optional for temporary repos
    isActive: v.boolean(),
    defaultBranch: v.optional(v.string()),
    language: v.optional(v.string()),
    stars: v.optional(v.number()),
    lastSyncedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_full_name", ["fullName"])
    .index("by_owner", ["owner"]),

  // Code reviews
  reviews: defineTable({
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
    prNumber: v.number(),
    prTitle: v.string(),
    prUrl: v.string(),
    prAuthor: v.string(),
    prAuthorAvatar: v.optional(v.string()),
    baseBranch: v.string(),
    headBranch: v.string(),
    status: v.string(), // pending, analyzing, completed, failed, cancelled
    overallAssessment: v.optional(v.string()),
    complexityScore: v.optional(v.number()),
    recommendation: v.optional(v.string()), // APPROVE, REQUEST_CHANGES, COMMENT
    aiProvider: v.optional(v.string()),
    analyzedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    analysisId: v.optional(v.id("repositoryAnalyses")), // Link to repository analysis if prNumber === 0
  })
    .index("by_user", ["userId"])
    .index("by_repository", ["repositoryId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_pr", ["repositoryId", "prNumber"])
    .index("by_analysis", ["analysisId"]),

  // Individual code issues found
  issues: defineTable({
    reviewId: v.id("reviews"),
    severity: v.string(), // CRITICAL, HIGH, MEDIUM, LOW, INFO
    type: v.string(), // bug, security, performance, quality, style, documentation
    file: v.string(),
    line: v.optional(v.number()),
    endLine: v.optional(v.number()),
    description: v.string(),
    suggestion: v.optional(v.string()),
    codeExample: v.optional(v.string()),
    isResolved: v.optional(v.boolean()),
  })
    .index("by_review", ["reviewId"])
    .index("by_severity", ["reviewId", "severity"]),

  // Review metrics
  metrics: defineTable({
    reviewId: v.id("reviews"),
    filesChanged: v.number(),
    linesAdded: v.number(),
    linesDeleted: v.number(),
    analysisTimeMs: v.number(),
    aiTokensUsed: v.number(),
    costEstimate: v.optional(v.number()),
  }).index("by_review", ["reviewId"]),

  // Repository analyses (full codebase analysis)
  repositoryAnalyses: defineTable({
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
    status: v.string(), // queued, analyzing, completed, failed
    aiProvider: v.string(), // openai, claude, gemini
    overallScore: v.optional(v.number()), // 1-100
    totalFiles: v.number(),
    filesAnalyzed: v.number(),
    totalIssues: v.number(),
    criticalIssues: v.number(),
    highIssues: v.number(),
    mediumIssues: v.number(),
    lowIssues: v.number(),
    summary: v.optional(v.string()),
    recommendations: v.optional(v.array(v.string())),
    analyzedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_repository", ["repositoryId"])
    .index("by_status", ["status"]),

  // Repository issues (from full codebase analysis)
  repositoryIssues: defineTable({
    analysisId: v.id("repositoryAnalyses"),
    severity: v.string(), // CRITICAL, HIGH, MEDIUM, LOW, INFO
    type: v.string(), // bug, security, performance, quality, style
    file: v.string(),
    line: v.optional(v.number()),
    description: v.string(),
    suggestion: v.optional(v.string()),
    codeExample: v.optional(v.string()),
  })
    .index("by_analysis", ["analysisId"])
    .index("by_severity", ["analysisId", "severity"]),

  // User settings per user
  userSettings: defineTable({
    userId: v.id("users"),
    aiProvider: v.string(), // openai, claude, gemini
    openaiKey: v.optional(v.string()),
    anthropicKey: v.optional(v.string()),
    geminiKey: v.optional(v.string()),
    autoReview: v.optional(v.boolean()),
    reviewOnDraft: v.optional(v.boolean()),
    notificationEmail: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  // Activity log
  activities: defineTable({
    userId: v.id("users"),
    type: v.string(), // review_completed, issue_found, settings_updated
    repositoryId: v.optional(v.id("repositories")),
    reviewId: v.optional(v.id("reviews")),
    metadata: v.optional(v.any()),
    message: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"]),

  // Usage tracking for billing
  usage: defineTable({
    userId: v.id("users"),
    month: v.string(), // YYYY-MM
    reviewsCount: v.number(),
    tokensUsed: v.number(),
    apiCallsCount: v.number(),
    estimatedCost: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_month", ["userId", "month"]),

  // Debug sessions tracking
  debugSessions: defineTable({
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
    sessionName: v.string(),
    status: v.string(), // "generating", "ready", "pushed", "failed"
    selectedIssues: v.optional(v.array(v.string())), // Issue IDs from analysis
    manualCode: v.optional(v.string()),
    totalIssues: v.number(),
    fixedIssues: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    branch: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_repository", ["repositoryId"])
    .index("by_status", ["status"]),

  // Debug fixes for individual issues
  debugFixes: defineTable({
    sessionId: v.id("debugSessions"),
    issueId: v.optional(v.string()), // From repositoryIssues
    issueTitle: v.string(),
    issueDescription: v.string(),
    originalCode: v.optional(v.string()),
    fixedCode: v.optional(v.string()),
    explanation: v.optional(v.string()),
    analysis: v.optional(v.string()),
    status: v.string(), // "pending", "generating", "completed", "failed"
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_session", ["sessionId"])
    .index("by_status", ["status"]),
});
