import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: (ctx) => ctx.storage.generateUploadUrl(),
});
