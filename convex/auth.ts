// Authentication helper utilities
import { Query, Mutation } from "./_generated/server";

// Get current authenticated user from context
export async function getCurrentUser(ctx: Query | Mutation) {
  // In production, you'd validate a session token here
  // For now, we'll use a simple userId from the request
  const userId = ctx.auth.getUserIdentity();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

// Verify user owns a resource
export async function verifyUserOwnsRepository(
  ctx: Query | Mutation,
  userId: string,
  repositoryId: string
) {
  const repository = await ctx.db.get(repositoryId as any);
  
  if (!repository || repository.userId !== userId) {
    throw new Error("Unauthorized: You don't own this repository");
  }

  return repository;
}

// Verify user owns a review
export async function verifyUserOwnsReview(
  ctx: Query | Mutation,
  userId: string,
  reviewId: string
) {
  const review = await ctx.db.get(reviewId as any);
  
  if (!review || review.userId !== userId) {
    throw new Error("Unauthorized: You don't own this review");
  }

  return review;
}

// Rate limiting helper (simple in-memory version)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}
