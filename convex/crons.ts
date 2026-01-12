import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Cleanup old activities (keep last 30 days)
crons.daily(
  "cleanup old activities",
  { hourUTC: 2, minuteUTC: 0 },
  internal.maintenance.cleanupOldActivities,
  { daysToKeep: 30 }
);

// Update usage statistics daily
crons.daily(
  "update usage stats",
  { hourUTC: 1, minuteUTC: 0 },
  internal.maintenance.updateUsageStats
);

// Retry failed reviews (max 3 retries)
crons.interval(
  "retry failed reviews",
  { minutes: 5 },
  internal.maintenance.retryFailedReviews,
  { maxRetries: 3 }
);

export default crons;
