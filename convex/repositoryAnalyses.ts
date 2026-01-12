import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create repository analysis
export const createAnalysis = mutation({
    args: {
        userId: v.string(), // Temporarily string for backward compatibility
        repositoryId: v.id("repositories"),
        aiProvider: v.string(),
        status: v.string(),
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

        const analysisId = await ctx.db.insert("repositoryAnalyses", {
            userId: user!._id,
            repositoryId: args.repositoryId,
            aiProvider: args.aiProvider,
            status: args.status,
            totalFiles: 0,
            filesAnalyzed: 0,
            totalIssues: 0,
            criticalIssues: 0,
            highIssues: 0,
            mediumIssues: 0,
            lowIssues: 0,
        });

        const analysis = await ctx.db.get(analysisId);
        return analysis;
    },
});

// Update repository analysis
export const updateAnalysis = mutation({
    args: {
        analysisId: v.id("repositoryAnalyses"),
        status: v.optional(v.string()),
        overallScore: v.optional(v.number()),
        totalFiles: v.optional(v.number()),
        filesAnalyzed: v.optional(v.number()),
        totalIssues: v.optional(v.number()),
        criticalIssues: v.optional(v.number()),
        highIssues: v.optional(v.number()),
        mediumIssues: v.optional(v.number()),
        lowIssues: v.optional(v.number()),
        summary: v.optional(v.string()),
        recommendations: v.optional(v.array(v.string())),
        analyzedAt: v.optional(v.number()),
        failureReason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { analysisId, ...updates } = args;

        const analysis = await ctx.db.get(analysisId);
        if (!analysis) {
            throw new Error("Analysis not found");
        }

        await ctx.db.patch(analysisId, updates);
        return analysisId;
    },
});

// Get analyses for a repository
export const getAnalysesByRepository = query({
    args: { repositoryId: v.id("repositories") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("repositoryAnalyses")
            .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
            .order("desc")
            .collect();
    },
});

// Get analysis by ID with issues
export const getAnalysisById = query({
    args: { analysisId: v.id("repositoryAnalyses") },
    handler: async (ctx, args) => {
        const analysis = await ctx.db.get(args.analysisId);
        if (!analysis) return null;

        const issues = await ctx.db
            .query("repositoryIssues")
            .withIndex("by_analysis", (q) => q.eq("analysisId", args.analysisId))
            .collect();

        return {
            ...analysis,
            issues,
        };
    },
});

// Get latest analysis for a repository
export const getLatestAnalysis = query({
    args: { repositoryId: v.id("repositories") },
    handler: async (ctx, args) => {
        const analyses = await ctx.db
            .query("repositoryAnalyses")
            .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
            .order("desc")
            .take(1);

        return analyses.length > 0 ? analyses[0] : null;
    },
});

// Add issues to analysis
export const addIssues = mutation({
    args: {
        analysisId: v.id("repositoryAnalyses"),
        issues: v.array(
            v.object({
                severity: v.string(),
                type: v.string(),
                file: v.string(),
                line: v.optional(v.number()),
                description: v.string(),
                suggestion: v.optional(v.string()),
                codeExample: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        for (const issue of args.issues) {
            await ctx.db.insert("repositoryIssues", {
                analysisId: args.analysisId,
                ...issue,
            });
        }
    },
});

// Get all analyses for a user
export const getUserAnalyses = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        // Get user
        let user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("githubId"), args.userId))
            .first();

        if (!user) {
            return [];
        }

        // Get all analyses for user
        const analyses = await ctx.db
            .query("repositoryAnalyses")
            .withIndex("by_user", (q) => q.eq("userId", user!._id))
            .order("desc")
            .collect();

        // Enrich with repository details
        const enrichedAnalyses = await Promise.all(
            analyses.map(async (analysis) => {
                const repository = await ctx.db.get(analysis.repositoryId);
                return {
                    ...analysis,
                    repositoryName: repository?.fullName || 'Unknown',
                    repositoryOwner: repository?.owner || '',
                };
            })
        );

        return enrichedAnalyses;
    },
});
