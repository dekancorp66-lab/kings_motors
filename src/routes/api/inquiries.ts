import { createFileRoute } from "@tanstack/react-router";
import { addInquiry, listInquiries } from "@/lib/store.server";
import { bearer, clean, fastapi, isEmail, jsonResponse, readJson } from "@/lib/fastapi.server";

export const Route = createFileRoute("/api/inquiries")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = bearer(request);
        const upstream = await fastapi("/api/inquiries", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (upstream) return upstream;
        if (!token) return jsonResponse({ detail: "Authentication required." }, 401);
        return jsonResponse({ inquiries: listInquiries() });
      },
      POST: async ({ request }) => {
        const body = await readJson(request);
        if (!body) return jsonResponse({ detail: "Invalid JSON." }, 400);
        const payload = {
          firstName: clean(body.firstName, 60),
          lastName: clean(body.lastName, 60),
          email: clean(body.email, 120).toLowerCase(),
          phone: clean(body.phone, 32),
          vehicle: clean(body.vehicle, 120),
          message: clean(body.message, 2000),
        };
        if (!payload.firstName || !payload.lastName || !isEmail(payload.email) || payload.message.length < 8) {
          return jsonResponse({ detail: "Please complete every required field." }, 422);
        }
        const upstream = await fastapi("/api/inquiries", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (upstream) return upstream;
        const row = addInquiry(payload);
        return jsonResponse({ id: row.id, status: "received" });
      },
    },
  },
});
