import { createFileRoute } from "@tanstack/react-router";
import { readUpload } from "@/lib/vehicle-store.server";

export const Route = createFileRoute("/api/uploads/$name")({
  server: {
    handlers: {
      // Public: photos are shown on the website. Names are random UUIDs, so they're unguessable
      // and never change content — safe to cache for a year.
      GET: async ({ params }) => {
        const file = await readUpload(params.name);
        if (!file) return new Response("Not found", { status: 404 });
        return new Response(new Uint8Array(file.data), {
          headers: {
            "Content-Type": file.type,
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
