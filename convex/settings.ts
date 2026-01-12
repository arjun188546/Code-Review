import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user settings
export const getUserSettings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("githubId"), args.userId))
      .first();

    if (!user) {
      return null;
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return settings || null;
  },
});

// Create user settings
export const createUserSettings = mutation({
  args: {
    userId: v.string(),
    aiProvider: v.string(),
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

    const settingsId = await ctx.db.insert("userSettings", {
      userId: user!._id,
      aiProvider: args.aiProvider,
    });

    return await ctx.db.get(settingsId);
  },
});

// Update user settings
export const updateUserSettings = mutation({
  args: {
    userId: v.string(),
    aiProvider: v.optional(v.string()),
    openaiKey: v.optional(v.string()),
    anthropicKey: v.optional(v.string()),
    geminiKey: v.optional(v.string()),
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

    const { userId: _, ...updateData } = args;

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", user!._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
      return await ctx.db.get(existing._id);
    }

    const settingsId = await ctx.db.insert("userSettings", {
      userId: user!._id,
      aiProvider: args.aiProvider || "openai",
      openaiKey: args.openaiKey,
      anthropicKey: args.anthropicKey,
      geminiKey: args.geminiKey,
    });

    return await ctx.db.get(settingsId);
  },
});

// Get API keys for analysis
export const getApiKeys = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!settings) {
      return null;
    }

    return {
      aiProvider: settings.aiProvider,
      openaiKey: settings.openaiKey,
      anthropicKey: settings.anthropicKey,
      geminiKey: settings.geminiKey,
    };
  },
});
