import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create review with enhanced data
export const createReview = mutation({
  args: {
    userId: v.string(), // Temporarily string for backward compatibility
    repositoryId: v.id("repositories"),
    prNumber: v.number(),
    prTitle: v.string(),
    prUrl: v.string(),
    status: v.optional(v.string()),
    prAuthor: v.optional(v.string()),
    prAuthorAvatar: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    headBranch: v.optional(v.string()),
    analysisId: v.optional(v.id("repositoryAnalyses")),
  },
  handler: async (ctx, args) => {
    // Get or create user
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("githubId"), args.userId))
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        githubId: args.userId,
        username: args.userId,
        email: `${args.userId}@example.com`,
      });
      user = await ctx.db.get(userId);
    }

    const reviewId = await ctx.db.insert("reviews", {
      userId: user!._id,
      repositoryId: args.repositoryId,
      prNumber: args.prNumber,
      prTitle: args.prTitle,
      prUrl: args.prUrl,
      prAuthor: args.prAuthor || "unknown",
      prAuthorAvatar: args.prAuthorAvatar,
      baseBranch: args.baseBranch || "main",
      headBranch: args.headBranch || "feature",
      status: args.status || "pending",
      retryCount: 0,
      analysisId: args.analysisId,
    });

    // Log activity
    await ctx.db.insert("activities", {
      userId: user!._id,
      type: "review_created",
      repositoryId: args.repositoryId,
      reviewId,
      message: `Created review for PR #${args.prNumber}`,
    });

    const review = await ctx.db.get(reviewId);
    return review;
  },
});

// Update review with validation
export const updateReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    status: v.optional(v.string()),
    overallAssessment: v.optional(v.string()),
    complexityScore: v.optional(v.number()),
    recommendation: v.optional(v.string()),
    aiProvider: v.optional(v.string()),
    analyzedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { reviewId, ...updates } = args;

    const review = await ctx.db.get(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // If completing, log activity
    if (updates.status === "completed") {
      await ctx.db.insert("activities", {
        userId: review.userId,
        type: "review_completed",
        repositoryId: review.repositoryId,
        reviewId,
        message: `Completed review for PR #${review.prNumber}`,
      });
    }

    await ctx.db.patch(reviewId, updates);
    return reviewId;
  },
});

// Get user reviews with pagination
export const getUserReviews = query({
  args: {
    userId: v.string(), // Temporarily string
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    repositoryId: v.optional(v.id("repositories")),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("githubId"), args.userId))
      .first();

    if (!user) {
      return [];
    }

    let query = ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    const reviews = await query.collect();

    let filtered = reviews;
    if (args.status) {
      filtered = reviews.filter((r) => r.status === args.status);
    }
    if (args.repositoryId) {
      filtered = filtered.filter((r) => r.repositoryId === args.repositoryId);
    }

    // Simple pagination
    const limit = args.limit || 50;
    return filtered.slice(0, limit);
  },
});

// Get review by ID
export const getReviewById = query({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reviewId);
  },
});

// Get review by ID with all related data
export const getReviewWithDetails = query({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) return null;

    const [issues, metrics, repository] = await Promise.all([
      ctx.db
        .query("issues")
        .withIndex("by_review", (q) => q.eq("reviewId", args.reviewId))
        .collect(),
      ctx.db
        .query("metrics")
        .withIndex("by_review", (q) => q.eq("reviewId", args.reviewId))
        .first(),
      ctx.db.get(review.repositoryId),
    ]);

    const issuesBySeverity = {
      CRITICAL: issues.filter((i) => i.severity === "CRITICAL").length,
      HIGH: issues.filter((i) => i.severity === "HIGH").length,
      MEDIUM: issues.filter((i) => i.severity === "MEDIUM").length,
      LOW: issues.filter((i) => i.severity === "LOW").length,
      INFO: issues.filter((i) => i.severity === "INFO").length,
    };

    return {
      ...review,
      issues,
      issuesBySeverity,
      metrics,
      repository,
    };
  },
});

// Add multiple issues in batch
export const addIssues = mutation({
  args: {
    reviewId: v.id("reviews"),
    issues: v.array(
      v.object({
        severity: v.string(),
        type: v.string(),
        file: v.string(),
        line: v.optional(v.number()),
        endLine: v.optional(v.number()),
        description: v.string(),
        suggestion: v.optional(v.string()),
        codeExample: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    const issueIds = await Promise.all(
      args.issues.map((issue) =>
        ctx.db.insert("issues", {
          reviewId: args.reviewId,
          ...issue,
          isResolved: false,
        })
      )
    );

    // Log critical issues
    const criticalIssues = args.issues.filter((i) => i.severity === "CRITICAL");
    if (criticalIssues.length > 0) {
      await ctx.db.insert("activities", {
        userId: review.userId,
        type: "issue_found",
        repositoryId: review.repositoryId,
        reviewId: args.reviewId,
        metadata: { criticalCount: criticalIssues.length },
        message: `Found ${criticalIssues.length} critical issue(s) in PR #${review.prNumber}`,
      });
    }

    return issueIds;
  },
});

// Get comprehensive review statistics
export const getReviewStats = query({
  args: { userId: v.string(), timeRange: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("githubId"), args.userId))
      .first();

    if (!user) {
      return {
        totalReviews: 0,
        byStatus: { pending: 0, analyzing: 0, completed: 0, failed: 0 },
        totalIssues: 0,
        issuesBySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 },
        averageComplexity: 0,
      };
    }

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter by time range if specified
    let filteredReviews = reviews;
    if (args.timeRange) {
      const now = Date.now();
      const ranges: Record<string, number> = {
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
      };
      const cutoff = now - (ranges[args.timeRange] || ranges["30d"]);
      filteredReviews = reviews.filter((r) => r._creationTime > cutoff);
    }

    const totalReviews = filteredReviews.length;
    const byStatus = {
      pending: filteredReviews.filter((r) => r.status === "pending").length,
      analyzing: filteredReviews.filter((r) => r.status === "analyzing").length,
      completed: filteredReviews.filter((r) => r.status === "completed").length,
      failed: filteredReviews.filter((r) => r.status === "failed").length,
    };

    // Get issues for completed reviews
    const completedReviewIds = filteredReviews
      .filter((r) => r.status === "completed")
      .map((r) => r._id);

    const issuesPromises = completedReviewIds.map((id) =>
      ctx.db
        .query("issues")
        .withIndex("by_review", (q) => q.eq("reviewId", id))
        .collect()
    );

    const allIssues = (await Promise.all(issuesPromises)).flat();

    const issuesBySeverity = {
      CRITICAL: allIssues.filter((i) => i.severity === "CRITICAL").length,
      HIGH: allIssues.filter((i) => i.severity === "HIGH").length,
      MEDIUM: allIssues.filter((i) => i.severity === "MEDIUM").length,
      LOW: allIssues.filter((i) => i.severity === "LOW").length,
      INFO: allIssues.filter((i) => i.severity === "INFO").length,
    };

    // Average complexity score
    const completedWithScore = filteredReviews.filter(
      (r) => r.status === "completed" && r.complexityScore
    );
    const avgComplexity =
      completedWithScore.length > 0
        ? completedWithScore.reduce((sum, r) => sum + (r.complexityScore || 0), 0) /
        completedWithScore.length
        : 0;

    // Get metrics for analysis time
    const metricsPromises = completedReviewIds.map((id) =>
      ctx.db
        .query("metrics")
        .withIndex("by_review", (q) => q.eq("reviewId", id))
        .first()
    );

    const allMetrics = (await Promise.all(metricsPromises)).filter(Boolean);
    const avgAnalysisTime =
      allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + (m?.analysisTimeMs || 0), 0) / allMetrics.length
        : 0;

    // Issues by type
    const issuesByType = {
      bug: allIssues.filter((i) => i.type === "bug").length,
      security: allIssues.filter((i) => i.type === "security").length,
      performance: allIssues.filter((i) => i.type === "performance").length,
      quality: allIssues.filter((i) => i.type === "quality").length,
      style: allIssues.filter((i) => i.type === "style").length,
    };

    return {
      totalReviews,
      avgComplexity: Math.round(avgComplexity * 10) / 10,
      criticalIssues: issuesBySeverity.CRITICAL,
      avgAnalysisTime: Math.round(avgAnalysisTime),
      issuesBySeverity,
      issuesByType,
    };
  },
});

// Get recent activity
export const getRecentActivity = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("githubId"), args.userId))
      .first();

    if (!user) {
      return [];
    }

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 20);

    return activities;
  },
});

// Create metrics for a review
export const createMetrics = mutation({
  args: {
    reviewId: v.id("reviews"),
    filesChanged: v.number(),
    linesAdded: v.number(),
    linesDeleted: v.number(),
    analysisTimeMs: v.number(),
    aiTokensUsed: v.number(),
  },
  handler: async (ctx, args) => {
    const { reviewId, ...metricsData } = args;

    return await ctx.db.insert("metrics", {
      reviewId,
      ...metricsData,
    });
  },
});