import { query } from "./_generated/server";
import { v } from "convex/values";

async function businessFor(ctx: any, externalId: string) {
  return ctx.db.query("businesses").withIndex("by_external_id", (q: any) => q.eq("externalId", externalId)).unique();
}

export const summary = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const business = await businessFor(ctx, externalId);
    if (!business) return { totalVehicles: 0, availableVehicles: 0, rentedVehicles: 0, activeInquiries: 0, activeReservations: 0, activeRentals: 0, pendingInspections: 0, todayRevenue: 0, revenueCurrency: "IDR" };
    const [vehicles, inquiries, reservations, rentals, inspections] = await Promise.all([
      ctx.db.query("vehicles").withIndex("by_business", q => q.eq("businessId", business._id)).collect(),
      ctx.db.query("inquiries").withIndex("by_business", q => q.eq("businessId", business._id)).collect(),
      ctx.db.query("reservations").withIndex("by_business", q => q.eq("businessId", business._id)).collect(),
      ctx.db.query("rentals").withIndex("by_business", q => q.eq("businessId", business._id)).collect(),
      ctx.db.query("inspections").withIndex("by_business", q => q.eq("businessId", business._id)).collect(),
    ]);
    return { totalVehicles: vehicles.length, availableVehicles: vehicles.filter(v => v.status === "available").length, rentedVehicles: vehicles.filter(v => v.status === "rented").length, activeInquiries: inquiries.filter(i => i.status === "new" || i.status === "contacted").length, activeReservations: reservations.filter(r => r.status !== "cancelled" && r.status !== "active").length, activeRentals: rentals.filter(r => r.status === "active").length, pendingInspections: inspections.filter(i => i.status === "Pending").length, todayRevenue: 0, revenueCurrency: "IDR" };
  },
});

export const timeline = query({ args: { externalId: v.string() }, handler: async (ctx, { externalId }) => { const business = await businessFor(ctx, externalId); return business ? ctx.db.query("timeline").withIndex("by_business", q => q.eq("businessId", business._id)).order("desc").collect() : []; } });
