import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or get repository (simpler for compatibility)
export const createOrGetRepository = mutation({
  args: {
    userId: v.string(), // Temporarily string for backward compatibility
    name: v.string(),
    owner: v.string(),
    fullName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("repositories")
      .withIndex("by_full_name", (q) => q.eq("fullName", args.fullName))
      .first();

    if (existing) {
      return existing;
    }

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

    const repoId = await ctx.db.insert("repositories", {
      userId: user!._id,
      name: args.name,
      owner: args.owner,
      fullName: args.fullName,
      isActive: true,
    });

    return await ctx.db.get(repoId);
  },
});

// Create or update repository
export const upsertRepository = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    owner: v.string(),
    fullName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("repositories")
      .withIndex("by_full_name", (q) => q.eq("fullName", args.fullName))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isActive: true,
      });
      return existing._id;
    }

    return await ctx.db.insert("repositories", {
      userId: args.userId,
      name: args.name,
      owner: args.owner,
      fullName: args.fullName,
      isActive: true,
    });
  },
});

// Get user repositories
export const getUserRepositories = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("githubId"), args.userId))
      .first();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("repositories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Get repository by full name
export const getByFullName = query({
  args: { fullName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_full_name", (q) => q.eq("fullName", args.fullName))
      .collect();
  },
});

// Get repository by full name
export const getRepositoryByFullName = query({
  args: { fullName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_full_name", (q) => q.eq("fullName", args.fullName))
      .first();
  },
});

// Get repository by ID
export const getRepositoryById = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.repositoryId);
  },
});
