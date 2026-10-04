const FASTAPI = "http://127.0.0.1:8000";

export async function fastapi(path: string, init: RequestInit = {}, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`${FASTAPI}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
    return response;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function bearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const cookie = request.headers.get("cookie") ?? "";
  const fromHeader = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const match = /(?:^|;\s*)mm_session=([^;]+)/.exec(cookie);
  const fromCookie = match ? decodeURIComponent(match[1]) : "";
  return fromHeader || fromCookie;
}

export function isEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

export function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .trim()
    .slice(0, max);
}
