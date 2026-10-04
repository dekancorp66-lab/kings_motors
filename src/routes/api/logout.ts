import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/fastapi.server";
import { clearSessionCookie } from "@/lib/session.server";

export const Route = createFileRoute("/api/logout")({
  server: {
    handlers: {
      POST: async () => {
        const response = jsonResponse({ ok: true });
        response.headers.append("Set-Cookie", clearSessionCookie);
        return response;
      },
    },
  },
});
