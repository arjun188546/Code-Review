import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Queue webhook event for processing
export const queueWebhookEvent = internalMutation({
  args: {
    repositoryId: v.id("repositories"),
    userId: v.id("users"),
    event: v.string(),
    action: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("webhookEvents", {
      repositoryId: args.repositoryId,
      userId: args.userId,
      event: args.event,
      action: args.action,
      payload: args.payload,
      processed: false,
    });
  },
});

// Get unprocessed webhook events
export const getUnprocessedEvents = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("webhookEvents")
      .withIndex("by_processed", (q) => q.eq("processed", false))
      .take(args.limit || 10);

    return events;
  },
});

// Mark webhook event as processed
export const markEventProcessed = internalMutation({
  args: {
    eventId: v.id("webhookEvents"),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      processed: true,
      processedAt: Date.now(),
      error: args.error,
    });
  },
});

// Process webhook event (called by scheduled function)
export const processWebhookEvent = internalMutation({
  args: { eventId: v.id("webhookEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.processed) return;

    await ctx.db.patch(args.eventId, {
      processingStartedAt: Date.now(),
    });

    try {
      // Handle pull_request events
      if (event.event === "pull_request" && event.action === "opened") {
        const pr = event.payload.pull_request;
        
        // Create review
        const reviewId = await ctx.db.insert("reviews", {
          userId: event.userId,
          repositoryId: event.repositoryId,
          prNumber: pr.number,
          prTitle: pr.title,
          prUrl: pr.html_url,
          prAuthor: pr.user.login,
          prAuthorAvatar: pr.user.avatar_url,
          baseBranch: pr.base.ref,
          headBranch: pr.head.ref,
          status: "pending",
        });

        // Log activity
        await ctx.db.insert("activities", {
          userId: event.userId,
          type: "webhook_received",
          repositoryId: event.repositoryId,
          reviewId: reviewId,
          message: `New PR #${pr.number}: ${pr.title}`,
        });
      }

      await ctx.db.patch(args.eventId, {
        processed: true,
        processedAt: Date.now(),
      });
    } catch (error: any) {
      await ctx.db.patch(args.eventId, {
        processed: true,
        processedAt: Date.now(),
        error: error.message,
      });
    }
  },
});
