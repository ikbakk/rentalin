/// <reference types="vite/client" />

import { expect, test } from "vitest";
import {
  businessDateToIso,
  durationInBusinessDays,
  formatBusinessDate,
  formatBusinessDateTime,
  isoToBusinessDate,
} from "../frontend/src/lib/business-time";

test("business date conversion uses WIB, WITA, and WIT explicitly", () => {
  expect(businessDateToIso("2026-10-11", "Asia/Jakarta")).toBe("2026-10-10T17:00:00.000Z");
  expect(businessDateToIso("2026-10-11", "Asia/Makassar")).toBe("2026-10-10T16:00:00.000Z");
  expect(businessDateToIso("2026-10-11", "Asia/Jayapura")).toBe("2026-10-10T15:00:00.000Z");
});

test("business date formatting round-trips for a rental calendar date", () => {
  const pickup = businessDateToIso("2026-10-11", "Asia/Makassar");
  expect(pickup).not.toBeNull();
  expect(isoToBusinessDate(pickup!, "Asia/Makassar")).toBe("2026-10-11");
  expect(formatBusinessDate(pickup!, "Asia/Makassar")).toBe("11 Oct 2026");
  expect(formatBusinessDateTime(pickup!, "Asia/Makassar")).toBe("11 Oct 2026, 00:00");
});

test("invalid and reversed rental dates are not treated as a valid duration", () => {
  expect(businessDateToIso("2026-02-30", "Asia/Jakarta")).toBeNull();
  expect(durationInBusinessDays("", "2026-10-12T00:00:00.000Z")).toBeNull();
  expect(durationInBusinessDays("2026-10-12T00:00:00.000Z", "2026-10-11T00:00:00.000Z")).toBeNull();
  expect(durationInBusinessDays("2026-10-11T00:00:00.000Z", "2026-10-13T00:00:00.000Z")).toBe(2);
});
