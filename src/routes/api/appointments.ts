import { createFileRoute } from "@tanstack/react-router";
import { addAppointment, listAppointments } from "@/lib/store.server";
import { bearer, clean, fastapi, isEmail, jsonResponse, readJson } from "@/lib/fastapi.server";

export const Route = createFileRoute("/api/appointments")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = bearer(request);
        const upstream = await fastapi("/api/appointments", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (upstream) return upstream;
        if (!token) return jsonResponse({ detail: "Authentication required." }, 401);
        return jsonResponse({ appointments: listAppointments() });
      },
      POST: async ({ request }) => {
        const body = await readJson(request);
        if (!body) return jsonResponse({ detail: "Invalid JSON." }, 400);
        const payload = {
          name: clean(body.name, 80),
          email: clean(body.email, 120).toLowerCase(),
          phone: clean(body.phone, 32),
          date: clean(body.date, 12),
          time: clean(body.time, 8),
          vehicle: clean(body.vehicle, 120),
          notes: clean(body.notes, 1000),
        };
        if (!payload.name || !isEmail(payload.email) || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date) || !payload.time) {
          return jsonResponse({ detail: "Please complete every required field." }, 422);
        }
        const upstream = await fastapi("/api/appointments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (upstream) return upstream;
        const row = addAppointment(payload);
        return jsonResponse({ id: row.id, status: "received" });
      },
    },
  },
});
