import { query } from "./_generated/server";
import { v } from "convex/values";

export const businessBySlug = query({ args: { slug: v.string() }, handler: (ctx, { slug }) => ctx.db.query("businesses").withIndex("by_slug", q => q.eq("slug", slug)).unique() });

export const reservationByToken = query({ args: { token: v.string() }, handler: async (ctx, { token }) => {
  const reservation = await ctx.db.query("reservations").filter(q => q.eq(q.field("publicToken"), token)).unique();
  if (!reservation) return null;
  const vehicle = await ctx.db.get(reservation.vehicleId);
  const customer = reservation.customerId ? await ctx.db.get(reservation.customerId) : null;
  const rental = await ctx.db.query("rentals").filter(q => q.eq(q.field("reservationId"), reservation._id)).first();
  return { reservationId: token, rentalId: rental?.publicToken ?? token, status: rental?.status ?? reservation.status, startDate: reservation.startDate, endDate: reservation.endDate, estimatedCost: reservation.estimatedCost, currency: reservation.currency, vehicleMake: vehicle?.make ?? "", vehicleModel: vehicle?.model ?? "", vehiclePlate: vehicle?.plateNumber ?? "", customerName: customer?.name ?? "", customerPhone: customer?.phoneNumber ?? "", rentalStarted: rental?.actualStart, rentalEnded: rental?.actualEnd, odometerStart: rental?.odometerStart, odometerEnd: rental?.odometerEnd, inspectionStatus: undefined, inspectionNotes: undefined };
} });
