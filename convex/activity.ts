import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export async function writeActivity(
  ctx: MutationCtx,
  input: {
    businessId: Id<"businesses">;
    referenceType: string;
    referenceId: string;
    eventType: string;
    description: string;
    actor: string;
  },
) {
  await ctx.db.insert("timeline", {
    ...input,
    occurredAt: new Date().toISOString(),
  });
}
