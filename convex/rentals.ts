import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({ args: { businessId: v.id("businesses") }, handler: (ctx, { businessId }) => ctx.db.query("rentals").withIndex("by_business", q => q.eq("businessId", businessId)).collect() });

export const listByExternalId = query({ args: { externalId: v.string() }, handler: async (ctx, { externalId }) => {
  const business = await ctx.db.query("businesses").withIndex("by_external_id", q => q.eq("externalId", externalId)).unique();
  return business ? ctx.db.query("rentals").withIndex("by_business", q => q.eq("businessId", business._id)).collect() : [];
} });

export const start = mutation({
  args: { reservationId: v.id("reservations"), odometerStart: v.number() },
  handler: async (ctx, { reservationId, odometerStart }) => {
    const reservation = await ctx.db.get(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    const id = await ctx.db.insert("rentals", { businessId: reservation.businessId, reservationId, vehicleId: reservation.vehicleId, customerId: reservation.customerId, actualStart: new Date().toISOString(), odometerStart, status: "active" });
    await ctx.db.patch(reservationId, { status: "active" });
    await ctx.db.patch(reservation.vehicleId, { status: "rented" });
    return ctx.db.get(id);
  },
});

export const complete = mutation({
  args: { rentalId: v.id("rentals"), odometerEnd: v.number() },
  handler: async (ctx, { rentalId, odometerEnd }) => {
    const rental = await ctx.db.get(rentalId);
    if (!rental) throw new Error("Rental not found");
    await ctx.db.patch(rentalId, { odometerEnd, actualEnd: new Date().toISOString(), status: "completed" });
    await ctx.db.patch(rental.vehicleId, { status: "available" });
    return ctx.db.get(rentalId);
  },
});
