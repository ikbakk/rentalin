import { query } from "./_generated/server";
import { v } from "convex/values";
import { summarizeLedger } from "./financeRules";

export const businessBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const business = await ctx.db.query("businesses").withIndex("by_slug", q => q.eq("slug", slug)).unique();
    if (!business) return null;
    return {
      name: business.name,
      slug: business.slug,
      address: business.address ?? "",
      phone: business.phone ?? "",
      email: business.email ?? "",
      logoUrl: business.logoUrl ?? null,
      timeZone: business.timeZone ?? "Asia/Jakarta",
    };
  },
});

export const reservationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (token.length < 32 || token.length > 128) return null;
    const reservation = await ctx.db.query("reservations").withIndex("by_public_token", q => q.eq("publicToken", token)).unique();
    if (!reservation) return null;

    const [vehicle, business, rental, payments] = await Promise.all([
      ctx.db.get(reservation.vehicleId),
      ctx.db.get(reservation.businessId),
      ctx.db.query("rentals").withIndex("by_reservation", q => q.eq("reservationId", reservation._id)).first(),
      ctx.db.query("payments").withIndex("by_reservation", q => q.eq("reservationId", reservation._id)).collect(),
    ]);
    const balance = summarizeLedger(reservation.estimatedCost, payments);

    const status = rental?.status === "completed"
      ? "Completed"
      : rental?.status === "active"
        ? "Active"
        : reservation.status === "ready"
          ? "Ready"
          : reservation.status === "preRental"
            ? "Preparing"
            : reservation.status === "cancelled"
              ? "Cancelled"
              : "Confirmed";

    return {
      reservationId: reservation._id,
      rentalId: rental?._id ?? reservation._id,
      status,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      estimatedCost: reservation.estimatedCost,
      amountReceived: balance.received,
      amountDue: balance.outstanding,
      currency: reservation.currency,
      vehicleMake: vehicle?.make ?? "",
      vehicleModel: vehicle?.model ?? "",
      vehiclePlate: vehicle?.plateNumber ?? "",
      rentalStarted: rental?.actualStart,
      rentalEnded: rental?.actualEnd,
      odometerStart: rental?.odometerStart,
      odometerEnd: rental?.odometerEnd,
      supportPhone: business?.phone ?? "",
      timeZone: business?.timeZone ?? "Asia/Jakarta",
    };
  },
});
