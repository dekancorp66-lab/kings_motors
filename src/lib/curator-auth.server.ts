import { bearer, fastapi, jsonResponse } from "@/lib/fastapi.server";
import { verifySession } from "@/lib/session.server";

/**
 * Guard for admin-only endpoints. Returns a 401 Response when the caller is not a
 * signed-in curator, or null when they are (so handlers do: `const deny = await ...; if (deny) return deny;`).
 *
 * Why two checks: login can be served by the FastAPI backend (its own token format) or
 * by this app (a JWT), depending on which is running. This mirrors /api/me exactly, so
 * "signed in on the dashboard" and "allowed to add a car" always mean the same thing.
 */
export async function requireCurator(request: Request): Promise<Response | null> {
  const token = bearer(request);
  if (!token) return jsonResponse({ detail: "Authentication required." }, 401);

  const upstream = await fastapi("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
  if (upstream?.ok) return null;

  try {
    await verifySession(token);
    return null;
  } catch {
    return jsonResponse({ detail: "Session expired. Please sign in again." }, 401);
  }
}
