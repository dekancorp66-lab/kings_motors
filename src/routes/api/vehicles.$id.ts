import { createFileRoute } from "@tanstack/react-router";
import { requireCurator } from "@/lib/curator-auth.server";
import { clean, jsonResponse, readJson } from "@/lib/fastapi.server";
import { deleteVehicle, updateVehicleStatus } from "@/lib/vehicle-store.server";
import { VEHICLE_STATUSES } from "@/lib/vehicle-input";
import type { VehicleStatus } from "@/data/types";

export const Route = createFileRoute("/api/vehicles/$id")({
  server: {
    handlers: {
      // Change availability (e.g. mark as sold).
      PATCH: async ({ request, params }) => {
        const deny = await requireCurator(request);
        if (deny) return deny;
        const body = await readJson(request);
        const status = clean(body?.status, 20) as VehicleStatus;
        if (!VEHICLE_STATUSES.includes(status)) return jsonResponse({ detail: "Unknown status." }, 422);
        try {
          const row = updateVehicleStatus(params.id, status);
          if (!row) return jsonResponse({ detail: "Vehicle not found." }, 404);
          return jsonResponse({ id: row.id, status: row.status });
        } catch {
          return jsonResponse({ detail: "Could not save the change." }, 500);
        }
      },

      DELETE: async ({ request, params }) => {
        const deny = await requireCurator(request);
        if (deny) return deny;
        try {
          if (!deleteVehicle(params.id)) return jsonResponse({ detail: "Vehicle not found." }, 404);
          return jsonResponse({ id: params.id, deleted: true });
        } catch {
          return jsonResponse({ detail: "Could not save the change." }, 500);
        }
      },
    },
  },
});
