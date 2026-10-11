import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireMembership, requirePermission } from "./tenancy";
import { assertVehicleAvailable, parseBookingInterval } from "./bookingRules";
const status = v.union(v.literal("confirmed"), v.literal("preRental"), v.literal("cancelled"), v.literal("ready"), v.literal("active"), v.literal("completed"));
export const list = query({ args: { businessId: v.id("businesses") }, handler: async (ctx, { businessId }) => { await requireMembership(ctx, businessId); return ctx.db.query("reservations").withIndex("by_business", q => q.eq("businessId", businessId)).collect(); } });
export const create = mutation({ args: { businessId: v.id("businesses"), inquiryId: v.optional(v.id("inquiries")), customerId: v.optional(v.id("customers")), vehicleId: v.id("vehicles"), startDate: v.string(), endDate: v.string(), estimatedCost: v.number(), currency: v.string() }, handler: async (ctx, { businessId, ...data }) => {
  await requireMembership(ctx, businessId);
  const interval = parseBookingInterval(data.startDate, data.endDate);
  if (!Number.isSafeInteger(data.estimatedCost) || data.estimatedCost < 0) throw new Error("Estimated cost must be a non-negative whole amount");
  if (data.currency !== "IDR") throw new Error("Only IDR is currently supported");

  const vehicle = await ctx.db.get(data.vehicleId);
  if (!vehicle || vehicle.businessId !== businessId) throw new Error("Vehicle not found");

  const inquiry = data.inquiryId ? await ctx.db.get(data.inquiryId) : null;
  if (data.inquiryId && (!inquiry || inquiry.businessId !== businessId || inquiry.vehicleId !== data.vehicleId)) throw new Error("Inquiry not found");
  const customerId = data.customerId ?? inquiry?.customerId;
  if (customerId) {
    const customer = await ctx.db.get(customerId);
    if (!customer || customer.businessId !== businessId) throw new Error("Customer not found");
    if (inquiry?.customerId && inquiry.customerId !== customerId) throw new Error("Inquiry customer does not match");
  }

  if (data.inquiryId) {
    const existing = await ctx.db.query("reservations").withIndex("by_inquiry", q => q.eq("inquiryId", data.inquiryId)).first();
    if (existing) {
      const sameRequest = existing.vehicleId === data.vehicleId
        && existing.startDate === interval.startDate
        && existing.endDate === interval.endDate
        && existing.estimatedCost === data.estimatedCost
        && existing.currency === data.currency
        && existing.customerId === customerId;
      if (!sameRequest) throw new Error("Inquiry already has a different reservation");
      return existing._id;
    }
    if (inquiry?.status !== "new" && inquiry?.status !== "contacted") throw new Error("Inquiry cannot be converted into a reservation");
  }

  await assertVehicleAvailable(ctx, vehicle, interval);
  const reservationId = await ctx.db.insert("reservations", {
    businessId,
    inquiryId: data.inquiryId,
    customerId,
    vehicleId: data.vehicleId,
    startDate: interval.startDate,
    endDate: interval.endDate,
    estimatedCost: data.estimatedCost,
    currency: data.currency,
    status: "confirmed",
    publicToken: crypto.randomUUID(),
  });
  if (inquiry) await ctx.db.patch(inquiry._id, { status: "converted" });
  return reservationId;
} });
export const setStatus = mutation({ args: { id: v.id("reservations"), status }, handler: async (ctx, { id, status }) => {
  const item = await ctx.db.get(id);
  if (!item) throw new Error("Reservation not found");
  await requireMembership(ctx, item.businessId);
  const allowedNext: Record<typeof item.status, readonly typeof status[]> = {
    confirmed: ["preRental", "cancelled"],
    preRental: ["ready", "cancelled"],
    ready: ["cancelled"],
    cancelled: [],
    active: [],
    completed: [],
  };
  if (item.status === status) return item;
  if (!allowedNext[item.status].includes(status)) throw new Error(`Cannot change reservation from ${item.status} to ${status}`);
  if (status === "preRental" || status === "ready") {
    const vehicle = await ctx.db.get(item.vehicleId);
    if (!vehicle || vehicle.businessId !== item.businessId) throw new Error("Vehicle not found");
    const interval = parseBookingInterval(item.startDate, item.endDate);
    await assertVehicleAvailable(ctx, vehicle, interval, item._id);
  }
  await ctx.db.patch(id, { status });
  return ctx.db.get(id);
} });
export const rotateTrackingToken = mutation({ args: { id: v.id("reservations") }, handler: async (ctx, { id }) => {
  const item = await ctx.db.get(id);
  if (!item) throw new Error("Reservation not found");
  await requirePermission(ctx, item.businessId, "manageBusiness");
  const publicToken = crypto.randomUUID();
  await ctx.db.patch(id, { publicToken });
  return publicToken;
} });
