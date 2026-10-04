import { createFileRoute } from "@tanstack/react-router";
import { updateAppointment } from "@/lib/store.server";
import { bearer, clean, fastapi, jsonResponse, readJson } from "@/lib/fastapi.server";
import type { Appointment } from "@/data/types";

const allowed = new Set<Appointment["status"]>(["confirmed", "pending", "completed"]);

export const Route = createFileRoute("/api/appointments/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const token = bearer(request);
        const body = await readJson(request);
        const status = clean(body?.status, 20) as Appointment["status"];
        const upstream = await fastapi(`/api/appointments/${params.id}`, {
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: JSON.stringify({ status }),
        });
        if (upstream) return upstream;
        if (!token) return jsonResponse({ detail: "Authentication required." }, 401);
        if (!allowed.has(status)) return jsonResponse({ detail: "Unknown status." }, 422);
        const row = updateAppointment(params.id, status);
        if (!row) return jsonResponse({ detail: "Appointment not found." }, 404);
        return jsonResponse({ id: row.id, status: row.status });
      },
    },
  },
});
