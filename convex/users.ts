import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get or create user by GitHub ID
export const getOrCreateUser = mutation({
  args: {
    githubId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .first();

    if (existing) {
      // Update access token
      await ctx.db.patch(existing._id, { accessToken: args.accessToken });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      githubId: args.githubId,
      username: args.username,
      email: args.email,
      avatarUrl: args.avatarUrl,
      accessToken: args.accessToken,
    });
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by GitHub ID
export const getUserByGithubId = query({
  args: { githubId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .first();
  },
});
