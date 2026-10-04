import { createServerFn } from "@tanstack/react-start";
import { getRouteApi } from "@tanstack/react-router";
import type { Vehicle } from "@/data/types";

/**
 * Loads the live stock list. A server function (not a plain fetch) because route loaders
 * also run during server-side rendering, where a relative "/api/..." URL doesn't resolve.
 * The store is imported dynamically so the Node-only code never reaches the browser bundle.
 */
export const getVehicles = createServerFn({ method: "GET" }).handler(async (): Promise<Vehicle[]> => {
  const { listVehicles } = await import("@/lib/vehicle-store.server");
  return listVehicles();
});

const rootApi = getRouteApi("__root__");

/**
 * Any component can call this to get the current stock. The root route loads it once per
 * navigation, so every page (home, inventory, contact, curator) sees the same fresh list,
 * and `router.invalidate()` after an admin change refreshes all of them at once.
 */
export function useVehicles(): Vehicle[] {
  return rootApi.useLoaderData();
}

export const uniqueSorted = (values: string[]) => [...new Set(values.filter(Boolean))].sort();
