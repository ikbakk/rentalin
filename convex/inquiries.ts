import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createPublic = mutation({
  args: {
    slug: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    vehicleId: v.id("vehicles"),
    startDate: v.string(),
    endDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!business) throw new Error("Business not found");

    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle || vehicle.businessId !== business._id) {
      throw new Error("Vehicle not found");
    }

    return ctx.db.insert("inquiries", {
      businessId: business._id,
      vehicleId: args.vehicleId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      startDate: args.startDate,
      endDate: args.endDate,
      notes: args.notes,
      status: "new",
    });
  },
});
