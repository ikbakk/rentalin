/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as businesses from "../businesses.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as files from "../files.js";
import type * as fleet from "../fleet.js";
import type * as http from "../http.js";
import type * as inquiries from "../inquiries.js";
import type * as inspections from "../inspections.js";
import type * as operations from "../operations.js";
import type * as public_ from "../public.js";
import type * as rentals from "../rentals.js";
import type * as reservations from "../reservations.js";
import type * as search from "../search.js";
import type * as tenancy from "../tenancy.js";
import type * as vehicles from "../vehicles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  businesses: typeof businesses;
  customers: typeof customers;
  dashboard: typeof dashboard;
  files: typeof files;
  fleet: typeof fleet;
  http: typeof http;
  inquiries: typeof inquiries;
  inspections: typeof inspections;
  operations: typeof operations;
  public: typeof public_;
  rentals: typeof rentals;
  reservations: typeof reservations;
  search: typeof search;
  tenancy: typeof tenancy;
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
