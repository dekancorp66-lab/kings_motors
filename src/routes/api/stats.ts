import { createFileRoute } from "@tanstack/react-router";
import { stats } from "@/lib/store.server";
import { bearer, fastapi, jsonResponse } from "@/lib/fastapi.server";
import { listVehicles } from "@/lib/vehicle-store.server";

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = bearer(request);
        const upstream = await fastapi("/api/stats", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (upstream?.ok) {
          const data = (await upstream.json()) as Record<string, number>;
          return jsonResponse({
            ...data,
            inStock: listVehicles().filter((item) => item.status === "available").length,
            sold: listVehicles().filter((item) => item.status === "sold").length,
          });
        }
        if (!token) return jsonResponse({ detail: "Authentication required." }, 401);
        return jsonResponse({
          ...stats(),
          inStock: listVehicles().filter((item) => item.status === "available").length,
          sold: listVehicles().filter((item) => item.status === "sold").length,
        });
      },
    },
  },
});
