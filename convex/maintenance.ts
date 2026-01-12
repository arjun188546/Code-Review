import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Cleanup old activities
export const cleanupOldActivities = internalMutation({
  args: { daysToKeep: v.number() },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - args.daysToKeep * 24 * 60 * 60 * 1000;
    
    const oldActivities = await ctx.db
      .query("activities")
      .filter((q) => q.lt(q.field("_creationTime"), cutoffTime))
      .collect();

    for (const activity of oldActivities) {
      await ctx.db.delete(activity._id);
    }

    console.log(`Deleted ${oldActivities.length} old activities`);
  },
});

// Update monthly usage statistics
export const updateUsageStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Get all users
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      // Get reviews for this month
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          return q.gte(q.field("_creationTime"), monthStart);
        })
        .collect();

      // Calculate tokens used (from metrics)
      let totalTokens = 0;
      for (const review of reviews) {
        const metrics = await ctx.db
          .query("metrics")
          .withIndex("by_review", (q) => q.eq("reviewId", review._id))
          .first();
        
        if (metrics) {
          totalTokens += metrics.aiTokensUsed;
        }
      }

      // Update or create usage record
      const existing = await ctx.db
        .query("usage")
        .withIndex("by_user_month", (q) => 
          q.eq("userId", user._id).eq("month", currentMonth)
        )
        .first();

      const estimatedCost = totalTokens * 0.00002; // $0.02 per 1K tokens estimate

      if (existing) {
        await ctx.db.patch(existing._id, {
          reviewsCount: reviews.length,
          tokensUsed: totalTokens,
          apiCallsCount: reviews.length,
          estimatedCost,
        });
      } else {
        await ctx.db.insert("usage", {
          userId: user._id,
          month: currentMonth,
          reviewsCount: reviews.length,
          tokensUsed: totalTokens,
          apiCallsCount: reviews.length,
          estimatedCost,
        });
      }
    }

    console.log(`Updated usage stats for ${users.length} users`);
  },
});

// Retry failed reviews
export const retryFailedReviews = internalMutation({
  args: { maxRetries: v.number() },
  handler: async (ctx, args) => {
    const failedReviews = await ctx.db
      .query("reviews")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .filter((q) => q.lt(q.field("retryCount"), args.maxRetries))
      .take(5);

    for (const review of failedReviews) {
      // Reset to pending for retry
      await ctx.db.patch(review._id, {
        status: "pending",
        retryCount: (review.retryCount || 0) + 1,
        failureReason: undefined,
      });

      await ctx.db.insert("activities", {
        userId: review.userId,
        type: "review_retried",
        repositoryId: review.repositoryId,
        reviewId: review._id,
        message: `Retrying review for PR #${review.prNumber} (attempt ${(review.retryCount || 0) + 1})`,
      });
    }

    console.log(`Queued ${failedReviews.length} reviews for retry`);
  },
});
