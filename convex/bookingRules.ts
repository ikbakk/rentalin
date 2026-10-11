import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

export const OCCUPYING_RESERVATION_STATUSES = ["confirmed", "preRental", "ready", "active"] as const;

export function parseBookingInterval(startDate: string, endDate: string) {
  const hasTimezone = (value: string) => /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  const startTime = Date.parse(startDate);
  const endTime = Date.parse(endDate);
  if (!hasTimezone(startDate) || !hasTimezone(endDate) || !Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    throw new Error("Choose a valid rental date range with an explicit timezone");
  }
  return {
    startTime,
    endTime,
    startDate: new Date(startTime).toISOString(),
    endDate: new Date(endTime).toISOString(),
  };
}

export function intervalsOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

export async function assertVehicleAvailable(
  ctx: MutationCtx,
  vehicle: Doc<"vehicles">,
  interval: { startTime: number; endTime: number },
  exceptReservationId?: Id<"reservations">,
) {
  if (vehicle.status === "maintenance" || vehicle.status === "inactive") {
    throw new Error("Vehicle is not available for booking");
  }

  const reservations = await ctx.db
    .query("reservations")
    .withIndex("by_vehicle", q => q.eq("vehicleId", vehicle._id))
    .collect();
  for (const reservation of reservations) {
    if (reservation._id === exceptReservationId || !OCCUPYING_RESERVATION_STATUSES.includes(reservation.status as typeof OCCUPYING_RESERVATION_STATUSES[number])) continue;
    const startTime = Date.parse(reservation.startDate);
    const endTime = Date.parse(reservation.endDate);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
      throw new Error("Vehicle availability cannot be verified until its existing reservation dates are corrected");
    }
    if (intervalsOverlap(interval.startTime, interval.endTime, startTime, endTime)) {
      throw new Error("Vehicle already has a reservation during those dates");
    }
  }

  const activeRentals = await ctx.db
    .query("rentals")
    .withIndex("by_vehicle", q => q.eq("vehicleId", vehicle._id))
    .collect();
  for (const rental of activeRentals.filter((item) => item.status === "active")) {
    const reservation = await ctx.db.get(rental.reservationId);
    if (!reservation) throw new Error("Vehicle availability cannot be verified because an active rental has no reservation");
    const startTime = Date.parse(reservation.startDate);
    const endTime = Date.parse(reservation.endDate);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
      throw new Error("Vehicle availability cannot be verified until its active rental dates are corrected");
    }
    if (intervalsOverlap(interval.startTime, interval.endTime, startTime, endTime)) {
      throw new Error("Vehicle is on an active rental during those dates");
    }
  }
}
