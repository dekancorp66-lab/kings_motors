import { createFileRoute } from "@tanstack/react-router";
import { requireCurator } from "@/lib/curator-auth.server";
import { jsonResponse, readJson } from "@/lib/fastapi.server";
import { addVehicle, listVehicles, VehicleError } from "@/lib/vehicle-store.server";
import { firstIssue, vehicleInputSchema } from "@/lib/vehicle-input";

export const Route = createFileRoute("/api/vehicles")({
  server: {
    handlers: {
      // Public: the website needs the stock list.
      GET: async () => jsonResponse({ vehicles: listVehicles() }),

      // Admin only: add a new vehicle.
      POST: async ({ request }) => {
        const deny = await requireCurator(request);
        if (deny) return deny;

        const body = await readJson(request);
        if (!body) return jsonResponse({ detail: "Invalid JSON." }, 400);

        // Re-validate on the server even though the form already did: never trust the browser.
        const parsed = vehicleInputSchema.safeParse(body);
        if (!parsed.success) return jsonResponse({ detail: firstIssue(parsed.error) }, 422);

        try {
          return jsonResponse({ vehicle: addVehicle(parsed.data) }, 201);
        } catch (error) {
          if (error instanceof VehicleError) return jsonResponse({ detail: error.message }, error.status);
          return jsonResponse({ detail: "Could not save the vehicle. Is the data folder writable?" }, 500);
        }
      },
    },
  },
});
