import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireMembership } from "./tenancy";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireMembership(ctx, businessId);
    const inspections = await ctx.db.query("inspections").withIndex("by_business", q => q.eq("businessId", businessId)).collect();
    return Promise.all(inspections.map(async (inspection) => ({
      ...inspection,
      photoStorageIds: inspection.photoUrls.filter((photo) => !/^https?:\/\//.test(photo)),
      photoUrls: await Promise.all(inspection.photoUrls.map(async (photo) => {
        if (/^https?:\/\//.test(photo)) return photo;
        return await ctx.storage.getUrl(photo as Id<"_storage">) ?? "";
      })),
    })));
  },
});

export const create = mutation({
  args: { businessId: v.id("businesses"), rentalId: v.optional(v.id("rentals")), reservationId: v.optional(v.id("reservations")), inspectionType: v.union(v.literal("PreRental"), v.literal("PostRental")) },
  handler: async (ctx, { businessId, rentalId, reservationId, inspectionType }) => {
    await requireMembership(ctx, businessId);
    if (!rentalId && !reservationId) throw new Error("Choose a reservation or rental for this inspection");
    if (inspectionType === "PostRental" && !rentalId) throw new Error("A post-rental inspection requires an active rental");

    const rental = rentalId ? await ctx.db.get(rentalId) : null;
    if (rentalId && (!rental || rental.businessId !== businessId)) throw new Error("Rental not found");
    const resolvedReservationId = reservationId ?? rental?.reservationId;
    const reservation = resolvedReservationId ? await ctx.db.get(resolvedReservationId) : null;
    if (!reservation || reservation.businessId !== businessId || (rental && rental.reservationId !== reservation._id)) throw new Error("Reservation not found");
    if (inspectionType === "PreRental" && (reservation.status === "active" || reservation.status === "completed")) {
      throw new Error("A pre-rental inspection must be created before handover");
    }
    if (inspectionType === "PostRental" && rental?.status !== "completed") {
      throw new Error("A post-rental inspection can be created after return");
    }
    const existing = await ctx.db.query("inspections").withIndex("by_reservation", q => q.eq("reservationId", reservation._id)).filter(q => q.eq(q.field("inspectionType"), inspectionType)).order("desc").first();
    if (existing && existing.status !== "Failed") return existing._id;

    return ctx.db.insert("inspections", {
      businessId,
      rentalId: rental?._id,
      reservationId: reservation._id,
      vehicleId: reservation.vehicleId,
      inspectionType,
      photoUrls: [],
      status: "Pending",
    });
  },
});

export const complete = mutation({
  args: { id: v.id("inspections"), photoUrls: v.array(v.string()), notes: v.optional(v.string()) },
  handler: async (ctx, { id, photoUrls, notes }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Inspection not found");
    await requireMembership(ctx, item.businessId);
    if (photoUrls.length > 10 || new Set(photoUrls).size !== photoUrls.length) throw new Error("An inspection can include up to 10 unique photos");
    if (notes && notes.length > 2000) throw new Error("Inspection notes are too long");
    if (item.status === "Completed") {
      if (JSON.stringify(item.photoUrls) !== JSON.stringify(photoUrls) || (notes !== undefined && item.notes !== notes.trim())) {
        throw new Error("Inspection is already complete and cannot be changed");
      }
      return item;
    }
    if (item.status !== "Pending") throw new Error("Only a pending inspection can be completed");

    const priorPhotos = new Set(item.photoUrls);
    for (const photo of photoUrls) {
      if (priorPhotos.has(photo)) continue;
      if (/^https?:\/\//.test(photo)) throw new Error("Inspection photos must be uploaded to this business first");
      const storageId = photo as Id<"_storage">;
      const claim = await ctx.db.query("uploadClaims").withIndex("by_storage", q => q.eq("storageId", storageId)).unique();
      if (!claim || claim.businessId !== item.businessId) throw new Error("Photo is not registered to this business");
      if (claim.status === "pending") await ctx.db.patch(claim._id, { status: "attached" });
    }

    await ctx.db.patch(id, { photoUrls, notes: notes?.trim() || item.notes, status: "Completed", inspectionDate: new Date().toISOString() });
    return ctx.db.get(id);
  },
});

export const fail = mutation({
  args: { id: v.id("inspections"), reason: v.string() },
  handler: async (ctx, { id, reason }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Inspection not found");
    await requireMembership(ctx, item.businessId);
    if (reason.trim().length < 1 || reason.length > 2000) throw new Error("Enter a valid inspection reason");
    if (item.status === "Failed" && item.notes === reason.trim()) return item;
    if (item.status !== "Pending") throw new Error("Only a pending inspection can be marked failed");
    const vehicle = await ctx.db.get(item.vehicleId);
    if (vehicle && vehicle.status !== "inactive") await ctx.db.patch(vehicle._id, { status: "maintenance" });
    await ctx.db.patch(id, { notes: reason.trim(), status: "Failed", inspectionDate: new Date().toISOString() });
    return ctx.db.get(id);
  },
});
