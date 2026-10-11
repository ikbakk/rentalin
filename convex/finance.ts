import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { netReceipts, summarizeLedger } from "./financeRules";
import { requireMembership, requirePermission } from "./tenancy";

const kindValidator = v.union(v.literal("payment"), v.literal("deposit"), v.literal("refund"));
const methodValidator = v.union(v.literal("cash"), v.literal("bank_transfer"), v.literal("other"));
const csvCell = (input: string | number) => {
  const value = String(input);
  const safeValue = /^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
};

export const add = mutation({
  args: {
    reservationId: v.id("reservations"),
    kind: kindValidator,
    amount: v.number(),
    method: methodValidator,
    reference: v.optional(v.string()),
    note: v.optional(v.string()),
    requestKey: v.string(),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) throw new Error("Reservation not found");
    const membership = await requirePermission(ctx, reservation.businessId, "managePayments");
    if (!Number.isSafeInteger(args.amount) || args.amount <= 0) throw new Error("Amount must be a positive whole IDR amount");
    if (args.reference && args.reference.length > 120) throw new Error("Reference is too long");
    if (args.note && args.note.length > 500) throw new Error("Note is too long");
    if (args.requestKey.length < 16 || args.requestKey.length > 128) throw new Error("Invalid payment request key");
    if (reservation.status === "cancelled" && args.kind !== "refund") throw new Error("Cancelled reservations can only receive refunds");

    const duplicate = await ctx.db.query("payments")
      .withIndex("by_business_and_request", q => q.eq("businessId", reservation.businessId).eq("requestKey", args.requestKey))
      .first();
    if (duplicate) {
      const sameEntry = duplicate.reservationId === reservation._id
        && duplicate.kind === args.kind
        && duplicate.amount === args.amount
        && duplicate.method === args.method
        && duplicate.reference === args.reference
        && duplicate.note === args.note;
      if (!sameEntry) throw new Error("Payment request key was already used for a different entry");
      return duplicate._id;
    }

    const existingEntries = await ctx.db.query("payments")
      .withIndex("by_reservation", q => q.eq("reservationId", reservation._id))
      .collect();
    if (args.kind === "refund") {
      const netReceived = netReceipts(existingEntries);
      if (args.amount > netReceived) throw new Error("Refund cannot exceed the recorded amount received");
    }

    const paymentId = await ctx.db.insert("payments", {
      businessId: reservation.businessId,
      reservationId: reservation._id,
      kind: args.kind,
      amount: args.amount,
      currency: "IDR",
      method: args.method,
      reference: args.reference?.trim() || undefined,
      note: args.note?.trim() || undefined,
      recordedAt: new Date().toISOString(),
      recordedBy: membership.userId,
      requestKey: args.requestKey,
    });
    return paymentId;
  },
});

export const listByReservation = query({
  args: { reservationId: v.id("reservations") },
  handler: async (ctx, { reservationId }) => {
    const reservation = await ctx.db.get(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    await requirePermission(ctx, reservation.businessId, "managePayments");
    return ctx.db.query("payments").withIndex("by_reservation", q => q.eq("reservationId", reservationId)).order("asc").collect();
  },
});

export const summaryByReservation = query({
  args: { reservationId: v.id("reservations") },
  handler: async (ctx, { reservationId }) => {
    const reservation = await ctx.db.get(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    await requireMembership(ctx, reservation.businessId);
    const entries = await ctx.db.query("payments").withIndex("by_reservation", q => q.eq("reservationId", reservationId)).collect();
    return summarizeLedger(reservation.estimatedCost, entries);
  },
});

export const summaryByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireMembership(ctx, businessId);
    const business = await ctx.db.get(businessId);
    if (!business) throw new Error("Business not found");
    const requestedTimeZone = business.timeZone ?? "Asia/Jakarta";
    const formatter = (zone: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" });
    let dateFormatter: Intl.DateTimeFormat;
    let timeZone = requestedTimeZone;
    try { dateFormatter = formatter(timeZone); } catch { timeZone = "Asia/Jakarta"; dateFormatter = formatter(timeZone); }
    const today = dateFormatter.format(new Date());
    const entries = await ctx.db.query("payments").withIndex("by_business", q => q.eq("businessId", businessId)).collect();
    const todayPayments = entries
      .filter((entry) => dateFormatter.format(new Date(entry.recordedAt)) === today)
      .reduce((total, entry) => total + (entry.kind === "refund" ? -entry.amount : entry.amount), 0);
    return { todayPayments, currency: "IDR" as const, timeZone };
  },
});

export const exportCsv = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requirePermission(ctx, businessId, "managePayments");
    const rows = await ctx.db.query("payments").withIndex("by_business", q => q.eq("businessId", businessId)).order("asc").take(5001);
    const truncated = rows.length > 5000;
    const exported = rows.slice(0, 5000);
    const lines = [
      ["recorded_at", "reservation_id", "type", "amount_idr", "method", "reference", "note", "recorded_by"].map(csvCell).join(","),
      ...exported.map((entry) => [
        entry.recordedAt,
        String(entry.reservationId),
        entry.kind,
        entry.kind === "refund" ? -entry.amount : entry.amount,
        entry.method,
        entry.reference ?? "",
        entry.note ?? "",
        String(entry.recordedBy),
      ].map(csvCell).join(",")),
    ];
    return { csv: lines.join("\r\n"), rowCount: exported.length, truncated };
  },
});
