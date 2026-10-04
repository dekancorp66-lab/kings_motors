import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.MERIDIAN_SECRET ?? "meridian-atelier-dev-key-change",
);

export async function signSession() {
  return new SignJWT({ role: "curator" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("curator@meridian.motors")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export function sessionCookie(token: string) {
  return `mm_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`;
}

export const clearSessionCookie =
  "mm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
