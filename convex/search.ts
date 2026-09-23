import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireMembership } from "./tenancy";

export const search = query({ args: { businessId: v.id("businesses"), query: v.string() }, handler: async (ctx, { businessId, query: term }) => {
  await requireMembership(ctx, businessId);
  const needle = term.toLowerCase();
  const [vehicles, customers, reservations] = await Promise.all([
    ctx.db.query("vehicles").withIndex("by_business", q => q.eq("businessId", businessId)).collect(),
    ctx.db.query("customers").withIndex("by_business", q => q.eq("businessId", businessId)).collect(),
    ctx.db.query("reservations").withIndex("by_business", q => q.eq("businessId", businessId)).collect(),
  ]);
  return {
    vehicles: vehicles.filter(v => `${v.plateNumber} ${v.make} ${v.model}`.toLowerCase().includes(needle)),
    customers: customers.filter(c => `${c.name} ${c.phoneNumber} ${c.email}`.toLowerCase().includes(needle)),
    reservations: reservations.filter(r => `${r.startDate} ${r.endDate}`.toLowerCase().includes(needle)),
  };
} });
