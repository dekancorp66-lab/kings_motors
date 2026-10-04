import { createFileRoute } from "@tanstack/react-router";
import { checkCurator } from "@/lib/store.server";
import { clean, fastapi, jsonResponse, readJson } from "@/lib/fastapi.server";
import { sessionCookie, signSession } from "@/lib/session.server";

export const Route = createFileRoute("/api/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await readJson(request);
        if (!body) return jsonResponse({ detail: "Invalid JSON." }, 400);
        const email = clean(body.email, 120).toLowerCase();
        const password = String(body.password ?? "");
        const upstream = await fastapi("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        if (upstream?.ok) {
          const data = (await upstream.json()) as { token: string; curator: { email: string; name: string } };
          const response = jsonResponse({ curator: data.curator });
          response.headers.append("Set-Cookie", sessionCookie(data.token));
          return response;
        }
        if (upstream && upstream.status === 401) {
          return jsonResponse({ detail: "Those credentials were not recognised." }, 401);
        }
        if (upstream && upstream.status === 429) {
          return jsonResponse({ detail: "Too many requests. Please wait a moment." }, 429);
        }
        if (!checkCurator(email, password)) {
          return jsonResponse({ detail: "Those credentials were not recognised." }, 401);
        }
        const token = await signSession();
        const response = jsonResponse({
          curator: { email, name: "Atelier Curator" },
        });
        response.headers.append("Set-Cookie", sessionCookie(token));
        return response;
      },
    },
  },
});
