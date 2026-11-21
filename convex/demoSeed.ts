import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

const DAY = 86_400_000;
const isoDay = (offset: number) => new Date(Date.now() + offset * DAY).toISOString();

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");
    const user = await ctx.db.get(userId);
    if (user?.email?.toLowerCase() !== "demo@rentalin.app") throw new Error("Demo seeding is restricted to the demo account");
    const memberships = await ctx.db.query("memberships").withIndex("by_user", q => q.eq("userId", userId)).collect();
    let business = memberships.find(m => m.isActive) ? await ctx.db.get(memberships.find(m => m.isActive)!.businessId) : null;
    if (business?.slug === "bali-motorent-demo") {
      const existing = await ctx.db.query("vehicles").withIndex("by_business", q => q.eq("businessId", business!._id)).first();
      if (existing) return { businessId: business!._id, seeded: false };
    }
    if (!business) {
      const businessId = await ctx.db.insert("businesses", { name: "Bali Motorent", slug: "bali-motorent-demo", createdBy: userId, phone: "+62 812 3456 7890", email: "hello@balimotorent.example", address: "Jl. Raya Kuta, Bali", timeZone: "Asia/Makassar" });
      await ctx.db.insert("memberships", { userId, businessId, role: "owner", isActive: true });
      await ctx.db.insert("userPreferences", { userId, activeBusinessId: businessId });
      business = await ctx.db.get(businessId);
    } else {
      await ctx.db.patch(business._id, { name: "Bali Motorent", slug: "bali-motorent-demo", phone: "+62 812 3456 7890", email: "hello@balimotorent.example", address: "Jl. Raya Kuta, Bali", timeZone: "Asia/Makassar" });
    }
    if (!business) throw new Error("Business setup failed");
    const businessId = business._id;
    const fleet = [
      ["Honda","Vario 160",2024,"DK 2814 AB","Matte black",2,"rented",135000], ["Yamaha","NMAX Connected",2024,"DK 4102 QZ","Metallic blue",2,"available",175000],
      ["Honda","PCX 160 ABS",2023,"DK 3391 ML","Pearl white",2,"available",185000], ["Toyota","Avanza Veloz",2023,"DK 1208 FA","Silver",7,"maintenance",650000],
      ["Honda","Scoopy Prestige",2024,"DK 5104 BX","Cream",2,"rented",110000], ["Toyota","Innova Zenix",2024,"DK 8812 CB","Black",7,"available",1100000],
      ["Honda","CR-V Turbo",2023,"DK 7710 TR","White",5,"reserved",1250000], ["Suzuki","Jimny 5-door",2024,"DK 4408 JM","Green",4,"available",950000],
      ["Yamaha","Fazzio Hybrid",2024,"DK 6291 FZ","Sage green",2,"available",100000], ["Honda","ADV 160",2023,"DK 5617 AD","Red",2,"rented",160000],
      ["Mitsubishi","Xpander Cross",2022,"DK 2274 XP","Graphite",7,"available",725000], ["Toyota","Agya GR Sport",2023,"DK 9033 AG","Yellow",5,"available",390000],
      ["Vespa","Primavera 150",2022,"DK 1805 VS","Pastel blue",2,"available",250000], ["Honda","Beat Street",2023,"DK 7713 BT","Black",2,"inactive",85000],
      ["Toyota","HiAce Premio",2022,"DK 9901 HC","White",12,"available",1500000], ["Daihatsu","Terios R",2021,"DK 6332 TR","Bronze",7,"available",575000],
    ] as const;
    const vehicleIds = [];
    for (const [make, model, year, plateNumber, color, seatingCapacity, status, dailyRate] of fleet) {
      vehicleIds.push(await ctx.db.insert("vehicles", { businessId, make, model, year, plateNumber, color, seatingCapacity, status, dailyRate, currency: "IDR" }));
    }
    const people = [
      ["Maya Putri","+62 812 1000 1001","maya.putri@example.com"], ["Alex Morgan","+62 812 1000 1002","alex.morgan@example.com"], ["I Made Adi","+62 812 1000 1003","made.adi@example.com"],
      ["Sophie Laurent","+62 812 1000 1004","sophie.laurent@example.com"], ["Budi Santoso","+62 812 1000 1005","budi.santoso@example.com"], ["Nina Chen","+62 812 1000 1006","nina.chen@example.com"],
      ["Rizky Pratama","+62 812 1000 1007","rizky.pratama@example.com"], ["Emma Wilson","+62 812 1000 1008","emma.wilson@example.com"], ["Komang Sari","+62 812 1000 1009","komang.sari@example.com"],
      ["Luca Romano","+62 812 1000 1010","luca.romano@example.com"], ["Dewi Kartika","+62 812 1000 1011","dewi.kartika@example.com"], ["Noah Kim","+62 812 1000 1012","noah.kim@example.com"],
    ] as const;
    const customerIds = [];
    for (let i = 0; i < people.length; i++) customerIds.push(await ctx.db.insert("customers", { businessId, name: people[i][0], phoneNumber: people[i][1], email: people[i][2], notes: i % 3 === 0 ? "Returning guest · prefers WhatsApp" : undefined }));
    const inquiryIds = [];
    for (const [customerIndex, vehicleIndex, status, startOffset] of [[0,1,"new",3],[3,7,"contacted",6],[5,11,"new",8],[8,8,"converted",1]] as const) {
      inquiryIds.push(await ctx.db.insert("inquiries", { businessId, vehicleId: vehicleIds[vehicleIndex], customerId: customerIds[customerIndex], customerName: people[customerIndex][0], customerPhone: people[customerIndex][1], startDate: isoDay(startOffset), endDate: isoDay(startOffset+3), notes: "Pickup time flexible; please confirm via WhatsApp.", status }));
    }
    const reservations = [
      { ci:1, vi:0, status:"active" as const, start:-1, days:4 }, { ci:2, vi:4, status:"active" as const, start:-2, days:5 },
      { ci:4, vi:6, status:"confirmed" as const, start:4, days:3 }, { ci:6, vi:2, status:"preRental" as const, start:1, days:2 },
      { ci:7, vi:9, status:"ready" as const, start:0, days:3 }, { ci:9, vi:10, status:"completed" as const, start:-12, days:4 },
      { ci:10, vi:12, status:"completed" as const, start:-20, days:2 }, { ci:11, vi:5, status:"confirmed" as const, start:7, days:5 },
    ];
    for (let i = 0; i < reservations.length; i++) {
      const r = reservations[i];
      const reservationId = await ctx.db.insert("reservations", { businessId, customerId: customerIds[r.ci], vehicleId: vehicleIds[r.vi], startDate: isoDay(r.start), endDate: isoDay(r.start+r.days), estimatedCost: fleet[r.vi][7] * r.days, currency: "IDR", status: r.status, publicToken: crypto.randomUUID() });
      if (["preRental","ready","active"].includes(r.status)) await ctx.db.insert("inspections", { businessId, reservationId, vehicleId: vehicleIds[r.vi], inspectionType: "PreRental", notes: "Tires, lights, bodywork and fuel checked. Clean and ready.", photoUrls: [], status: "Completed", inspectionDate: isoDay(r.start) });
      if (r.status === "active" || r.status === "completed") {
        const rentalId = await ctx.db.insert("rentals", { businessId, reservationId, vehicleId: vehicleIds[r.vi], customerId: customerIds[r.ci], actualStart: isoDay(r.start), actualEnd: r.status === "completed" ? isoDay(r.start+r.days) : undefined, odometerStart: 12450 + i * 1370, odometerEnd: r.status === "completed" ? 12890 + i * 1370 : undefined, status: r.status === "active" ? "active" : "completed", publicToken: crypto.randomUUID() });
        if (r.status === "completed") await ctx.db.insert("inspections", { businessId, rentalId, reservationId, vehicleId: vehicleIds[r.vi], inspectionType: "PostRental", notes: "Returned in good condition; fuel level recorded.", photoUrls: [], status: "Completed", inspectionDate: isoDay(r.start+r.days) });
      }
    }
    const now = Date.now();
    for (const [eventType, description, offset] of [["inquiry_received","New booking inquiry · Maya Putri",0],["reservation_confirmed","Reservation confirmed · Alex Morgan",-1],["inspection_completed","Pre-rental inspection completed · Yamaha ADV 160",-2],["rental_started","Vehicle handed over · Honda Vario 160",-3],["vehicle_service","Toyota Avanza marked for scheduled service",-5],["rental_completed","Rental completed · Mitsubishi Xpander Cross",-8]] as const) {
      await ctx.db.insert("timeline", { businessId, referenceType: "business", referenceId: String(businessId), eventType, description, occurredAt: new Date(now + offset*3_600_000).toISOString(), actor: String(userId) });
    }
    return { businessId, vehicles: fleet.length, customers: people.length, inquiries: inquiryIds.length, reservations: reservations.length, seeded: true };
  },
});
