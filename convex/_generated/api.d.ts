/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as auth from "../auth.js";
import type * as bookingRules from "../bookingRules.js";
import type * as businessTime from "../businessTime.js";
import type * as businesses from "../businesses.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as demoSeed from "../demoSeed.js";
import type * as fileRecords from "../fileRecords.js";
import type * as files from "../files.js";
import type * as finance from "../finance.js";
import type * as financeRules from "../financeRules.js";
import type * as fleet from "../fleet.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as inquiries from "../inquiries.js";
import type * as inspections from "../inspections.js";
import type * as lib_r2Storage from "../lib/r2Storage.js";
import type * as operations from "../operations.js";
import type * as passwordReset from "../passwordReset.js";
import type * as public_ from "../public.js";
import type * as r2 from "../r2.js";
import type * as r2Rules from "../r2Rules.js";
import type * as rentals from "../rentals.js";
import type * as reservations from "../reservations.js";
import type * as search from "../search.js";
import type * as staff from "../staff.js";
import type * as tenancy from "../tenancy.js";
import type * as turnstile from "../turnstile.js";
import type * as vehicles from "../vehicles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  auth: typeof auth;
  bookingRules: typeof bookingRules;
  businessTime: typeof businessTime;
  businesses: typeof businesses;
  crons: typeof crons;
  customers: typeof customers;
  dashboard: typeof dashboard;
  demoSeed: typeof demoSeed;
  fileRecords: typeof fileRecords;
  files: typeof files;
  finance: typeof finance;
  financeRules: typeof financeRules;
  fleet: typeof fleet;
  health: typeof health;
  http: typeof http;
  inquiries: typeof inquiries;
  inspections: typeof inspections;
  "lib/r2Storage": typeof lib_r2Storage;
  operations: typeof operations;
  passwordReset: typeof passwordReset;
  public: typeof public_;
  r2: typeof r2;
  r2Rules: typeof r2Rules;
  rentals: typeof rentals;
  reservations: typeof reservations;
  search: typeof search;
  staff: typeof staff;
  tenancy: typeof tenancy;
  turnstile: typeof turnstile;
  vehicles: typeof vehicles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
