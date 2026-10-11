import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { writeActivity } from "./activity";
import { assertVehicleAvailable, parseBookingInterval } from "./bookingRules";
import { requireMembership } from "./tenancy";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireMembership(ctx, businessId);
    const rentals = await ctx.db.query("rentals").withIndex("by_business", q => q.eq("businessId", businessId)).collect();
    return Promise.all(rentals.map(async (rental) => {
      const [vehicle, customer, reservation] = await Promise.all([
        ctx.db.get(rental.vehicleId),
        rental.customerId ? ctx.db.get(rental.customerId) : null,
        ctx.db.get(rental.reservationId),
      ]);
      const inquiry = reservation?.inquiryId ? await ctx.db.get(reservation.inquiryId) : null;
      return {
        ...rental,
        customerName: customer?.name ?? inquiry?.customerName ?? "",
        vehicleSummary: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})` : "Vehicle unavailable",
      };
    }));
  },
});

export const start = mutation({
  args: { reservationId: v.id("reservations"), odometerStart: v.number() },
  handler: async (ctx, { reservationId, odometerStart }) => {
    const reservation = await ctx.db.get(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    const membership = await requireMembership(ctx, reservation.businessId);

    const existing = await ctx.db.query("rentals").withIndex("by_reservation", q => q.eq("reservationId", reservationId)).first();
    if (existing) return existing;
    if (reservation.status !== "ready") throw new Error("Only a ready reservation can be handed over");
    if (!Number.isSafeInteger(odometerStart) || odometerStart < 0) throw new Error("Enter a valid starting odometer reading");
    const inspections = await ctx.db.query("inspections").withIndex("by_reservation", q => q.eq("reservationId", reservationId)).collect();
    if (!inspections.some((inspection) => inspection.inspectionType === "PreRental" && inspection.status === "Completed")) {
      throw new Error("Complete a pre-rental inspection before handover");
    }

    const vehicle = await ctx.db.get(reservation.vehicleId);
    if (!vehicle || vehicle.businessId !== reservation.businessId) throw new Error("Vehicle not found");
    if (vehicle.status === "maintenance" || vehicle.status === "inactive") throw new Error("Vehicle cannot be handed over in its current state");
    await assertVehicleAvailable(ctx, vehicle, parseBookingInterval(reservation.startDate, reservation.endDate), reservation._id);
    if (reservation.customerId) {
      const customer = await ctx.db.get(reservation.customerId);
      if (!customer || customer.businessId !== reservation.businessId) throw new Error("Customer not found");
    }

    const now = new Date().toISOString();
    const rentalId = await ctx.db.insert("rentals", {
      businessId: reservation.businessId,
      reservationId,
      vehicleId: reservation.vehicleId,
      customerId: reservation.customerId,
      actualStart: now,
      odometerStart,
      status: "active",
    });
    await ctx.db.patch(reservationId, { status: "active" });
    await ctx.db.patch(vehicle._id, { status: "rented" });
    const reservationInspections = await ctx.db.query("inspections").withIndex("by_reservation", q => q.eq("reservationId", reservationId)).collect();
    for (const inspection of reservationInspections) {
      if (inspection.inspectionType === "PreRental" && !inspection.rentalId) {
        await ctx.db.patch(inspection._id, { rentalId });
      }
    }
    await writeActivity(ctx, {
      businessId: reservation.businessId,
      referenceType: "rental",
      referenceId: String(rentalId),
      eventType: "rental_started",
      description: "Rental handed over to customer",
      actor: String(membership.userId),
    });
    return ctx.db.get(rentalId);
  },
});

export const historyByVehicle = query({
  args: { businessId: v.id("businesses"), vehicleId: v.id("vehicles") },
  handler: async (ctx, { businessId, vehicleId }) => {
    await requireMembership(ctx, businessId);
    const vehicle = await ctx.db.get(vehicleId);
    if (!vehicle || vehicle.businessId !== businessId) throw new Error("Vehicle not found");
    return ctx.db.query("rentals").withIndex("by_vehicle", q => q.eq("vehicleId", vehicleId)).collect();
  },
});

export const complete = mutation({
  args: { rentalId: v.id("rentals"), odometerEnd: v.number() },
  handler: async (ctx, { rentalId, odometerEnd }) => {
    const rental = await ctx.db.get(rentalId);
    if (!rental) throw new Error("Rental not found");
    const membership = await requireMembership(ctx, rental.businessId);
    if (rental.status === "completed") {
      if (rental.odometerEnd !== odometerEnd) throw new Error("Rental is already closed with a different odometer reading");
      return rental;
    }
    if (rental.status !== "active") throw new Error("Only an active rental can be returned");
    if (!Number.isSafeInteger(odometerEnd) || odometerEnd < (rental.odometerStart ?? 0)) {
      throw new Error("Ending odometer must be a whole number no lower than the starting reading");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(rentalId, { odometerEnd, actualEnd: now, status: "completed" });
    const vehicle = await ctx.db.get(rental.vehicleId);
    if (vehicle && vehicle.businessId === rental.businessId && vehicle.status !== "maintenance" && vehicle.status !== "inactive") {
      const otherRentals = await ctx.db.query("rentals").withIndex("by_vehicle", q => q.eq("vehicleId", vehicle._id)).collect();
      const anotherActiveRental = otherRentals.some((item) => item._id !== rentalId && item.status === "active");
      if (!anotherActiveRental) {
        const reservations = await ctx.db.query("reservations").withIndex("by_vehicle", q => q.eq("vehicleId", vehicle._id)).collect();
        const reservedAfterReturn = reservations.some((item) =>
          item.businessId === rental.businessId
          && item._id !== rental.reservationId
          && ["confirmed", "preRental", "ready", "active"].includes(item.status)
          && Date.parse(item.endDate) > Date.parse(now),
        );
        await ctx.db.patch(vehicle._id, { status: reservedAfterReturn ? "reserved" : "available" });
      }
    }
    await ctx.db.patch(rental.reservationId, { status: "completed" });
    await writeActivity(ctx, {
      businessId: rental.businessId,
      referenceType: "rental",
      referenceId: String(rentalId),
      eventType: "rental_completed",
      description: "Rental returned",
      actor: String(membership.userId),
    });
    return ctx.db.get(rentalId);
  },
});
