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
    const customerName = args.customerName.trim();
    const customerPhone = args.customerPhone.replace(/\D/g, "");
    const startTime = Date.parse(args.startDate);
    const endTime = Date.parse(args.endDate);
    if (customerName.length < 2 || customerName.length > 100) throw new Error("Enter a valid name");
    if (customerPhone.length < 8 || customerPhone.length > 15) throw new Error("Enter a valid phone number");
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) throw new Error("Choose a valid rental date range");
    if (args.notes && args.notes.length > 500) throw new Error("Notes are too long");

    const business = await ctx.db
      .query("businesses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!business) throw new Error("Business not found");

    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle || vehicle.businessId !== business._id || vehicle.status !== "available") {
      throw new Error("Vehicle not found");
    }

    const recentInquiries = await ctx.db
      .query("inquiries")
      .withIndex("by_business_and_phone", (q) => q.eq("businessId", business._id).eq("customerPhone", customerPhone))
      .order("desc")
      .take(3);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (recentInquiries.filter((inquiry) => inquiry._creationTime >= oneHourAgo).length >= 3) {
      throw new Error("Too many booking requests. Please try again later.");
    }

    return ctx.db.insert("inquiries", {
      businessId: business._id,
      vehicleId: args.vehicleId,
      customerName,
      customerPhone,
      startDate: args.startDate,
      endDate: args.endDate,
      notes: args.notes,
      status: "new",
    });
  },
});
