import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.interval("Clean abandoned R2 uploads", { hours: 1 }, internal.r2.cleanup, {});
crons.interval("Clean inquiry rate limit buckets", { hours: 1 }, internal.inquiries.cleanupLimits, {});
export default crons;
