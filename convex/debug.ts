import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new debug session
export const createDebugSession = mutation({
  args: {
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
    sessionName: v.string(),
    totalIssues: v.number(),
  },
  handler: async (ctx, args) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 [CONVEX] Creating Debug Session');
    console.log('User ID:', args.userId);
    console.log('Repository ID:', args.repositoryId);
    console.log('Session Name:', args.sessionName);
    console.log('Total Issues:', args.totalIssues);

    const sessionId = await ctx.db.insert("debugSessions", {
      userId: args.userId,
      repositoryId: args.repositoryId,
      sessionName: args.sessionName,
      status: "generating",
      totalIssues: args.totalIssues,
      fixedIssues: 0,
      startedAt: Date.now(),
    });

    console.log('✅ [CONVEX] Debug Session Created Successfully');
    console.log('Session ID:', sessionId);
    console.log('Status: generating');
    console.log('Started At:', new Date(Date.now()).toISOString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return sessionId;
  },
});

// Update debug session
export const updateDebugSession = mutation({
  args: {
    sessionId: v.id("debugSessions"),
    status: v.optional(v.string()),
    fixedIssues: v.optional(v.number()),
    branch: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args;

    const updateData: any = { ...updates };

    if (updates.status === "completed" || updates.status === "pushed") {
      updateData.completedAt = Date.now();
    }

    await ctx.db.patch(sessionId, updateData);

    return sessionId;
  },
});

// Get debug session by ID
export const getDebugSession = query({
  args: { sessionId: v.id("debugSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

// Get all debug sessions for a user
export const getUserDebugSessions = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    console.log('📖 [CONVEX] Fetching User Debug Sessions');
    console.log('User ID:', args.userId);
    console.log('Limit:', args.limit || 50);

    const sessions = await ctx.db
      .query("debugSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);

    console.log('✅ [CONVEX] Retrieved', sessions.length, 'debug sessions');

    return sessions;
  },
});

// Get debug sessions for a repository
export const getRepositoryDebugSessions = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("debugSessions")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .order("desc")
      .collect();
  },
});

// Create a debug fix
export const createDebugFix = mutation({
  args: {
    sessionId: v.id("debugSessions"),
    issueId: v.optional(v.string()),
    issueTitle: v.string(),
    issueDescription: v.string(),
    originalCode: v.optional(v.string()),
    fixedCode: v.optional(v.string()),
    explanation: v.optional(v.string()),
    analysis: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 [CONVEX] Creating Debug Fix');
    console.log('Session ID:', args.sessionId);
    console.log('Issue Title:', args.issueTitle);
    console.log('Issue Description:', args.issueDescription?.substring(0, 100) + '...');
    console.log('Has Original Code:', !!args.originalCode);
    console.log('Has Fixed Code:', !!args.fixedCode);
    console.log('Has Explanation:', !!args.explanation);
    console.log('Status:', args.status);

    const fixId = await ctx.db.insert("debugFixes", {
      ...args,
      createdAt: Date.now(),
    });

    console.log('✅ [CONVEX] Debug Fix Created Successfully');
    console.log('Fix ID:', fixId);

    // Update session's fixed issues count
    const session = await ctx.db.get(args.sessionId);
    if (session && args.status === "completed") {
      const newFixedCount = session.fixedIssues + 1;
      await ctx.db.patch(args.sessionId, {
        fixedIssues: newFixedCount,
      });
      console.log('📊 [CONVEX] Updated Session Fixed Issues Count:', newFixedCount, '/', session.totalIssues);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return fixId;
  },
});

// Update a debug fix
export const updateDebugFix = mutation({
  args: {
    fixId: v.id("debugFixes"),
    fixedCode: v.optional(v.string()),
    explanation: v.optional(v.string()),
    analysis: v.optional(v.string()),
    status: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { fixId, ...updates } = args;

    const updateData: any = { ...updates };

    if (updates.status === "completed") {
      updateData.completedAt = Date.now();
    }

    await ctx.db.patch(fixId, updateData);

    return fixId;
  },
});

// Get all fixes for a debug session
export const getSessionFixes = query({
  args: { sessionId: v.id("debugSessions") },
  handler: async (ctx, args) => {
    console.log('📖 [CONVEX] Fetching Session Fixes');
    console.log('Session ID:', args.sessionId);

    const fixes = await ctx.db
      .query("debugFixes")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();

    console.log('✅ [CONVEX] Retrieved', fixes.length, 'fixes for session');

    return fixes;
  },
});

// Get a single debug fix
export const getDebugFix = query({
  args: { fixId: v.id("debugFixes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fixId);
  },
});

// Delete a debug session and all its fixes
export const deleteDebugSession = mutation({
  args: { sessionId: v.id("debugSessions") },
  handler: async (ctx, args) => {
    // Delete all fixes first
    const fixes = await ctx.db
      .query("debugFixes")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const fix of fixes) {
      await ctx.db.delete(fix._id);
    }

    // Delete the session
    await ctx.db.delete(args.sessionId);

    return { success: true };
  },
});
