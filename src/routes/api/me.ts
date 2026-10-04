import { createFileRoute } from "@tanstack/react-router";
import { bearer, fastapi, jsonResponse } from "@/lib/fastapi.server";
import { verifySession } from "@/lib/session.server";

export const Route = createFileRoute("/api/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = bearer(request);
        if (!token) return jsonResponse({ detail: "Authentication required." }, 401);
        const upstream = await fastapi("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (upstream?.ok) return upstream;
        try {
          const payload = await verifySession(token);
          return jsonResponse({
            curator: { email: String(payload.sub ?? "curator@meridian.motors"), name: "Atelier Curator" },
          });
        } catch {
          return jsonResponse({ detail: "Session expired. Please sign in again." }, 401);
        }
      },
    },
  },
});
