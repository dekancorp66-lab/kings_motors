import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { vehicles as seedVehicles } from "@/data/catalog";
import type { Vehicle, VehicleStatus } from "@/data/types";
import { buildVehicle, slugify, type VehicleParsed } from "@/lib/vehicle-input";

/**
 * File-backed vehicle store.
 *
 * Why a JSON file: the old store lived in memory, so every dev-server restart wiped
 * whatever the admin added. A file in ./data survives restarts with zero extra setup
 * (no database to install). The first run seeds it from src/data/catalog.ts; after
 * that the file is the source of truth and the catalog is only the starting stock.
 *
 * NOTE: this needs a writable disk (your PC / a VPS). Serverless hosts such as Vercel
 * have a read-only disk — there you would swap this file for a database (see getSql()).
 */

const DATA_DIR = join(process.cwd(), "data");
const VEHICLES_FILE = join(DATA_DIR, "vehicles.json");
const UPLOAD_DIR = join(DATA_DIR, "uploads");

// Keep the cache on globalThis: Vite HMR re-evaluates this module on every edit, and a
// module-level variable would silently fork into two diverging copies of the list.
const globalRef = globalThis as typeof globalThis & { __vehicleCache__?: Vehicle[] };

function ensureDirs() {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

function persist(list: Vehicle[]) {
  ensureDirs();
  // Write to a temp file then rename. Why: rename is atomic, so a crash mid-write can
  // never leave a half-written (corrupt) vehicles.json behind.
  const tmp = `${VEHICLES_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8");
  renameSync(tmp, VEHICLES_FILE);
}

function load(): Vehicle[] {
  if (globalRef.__vehicleCache__) return globalRef.__vehicleCache__;
  let list: Vehicle[];
  if (existsSync(VEHICLES_FILE)) {
    try {
      list = JSON.parse(readFileSync(VEHICLES_FILE, "utf8")) as Vehicle[];
      if (!Array.isArray(list)) throw new Error("vehicles.json is not a list");
    } catch (error) {
      // Refuse to guess. Why: silently re-seeding would overwrite the admin's real
      // data the next time anything saved. Fail loudly so the file can be fixed.
      throw new Error(`data/vehicles.json is unreadable (${(error as Error).message}). Fix or delete it.`);
    }
  } else {
    list = seedVehicles.map((item) => ({ ...item }));
    try {
      persist(list);
    } catch {
      /* read-only disk: keep the seed in memory so the site still works */
    }
  }
  globalRef.__vehicleCache__ = list;
  return list;
}

export function listVehicles(): Vehicle[] {
  return load();
}

export function addVehicle(input: VehicleParsed): Vehicle {
  const list = load();
  if (list.some((item) => item.vin.toUpperCase() === input.vin.toUpperCase())) {
    throw new VehicleError("A vehicle with that VIN / chassis number already exists.", 409);
  }
  // Slugs are the page URL (/inventory/<slug>), so they must be unique: add -2, -3…
  const base = slugify(`${input.year} ${input.make} ${input.model} ${input.trim}`) || "vehicle";
  let slug = base;
  for (let n = 2; list.some((item) => item.slug === slug); n += 1) slug = `${base}-${n}`;

  const vehicle = buildVehicle(input, `veh_${randomUUID().slice(0, 8)}`, slug);
  const next = [vehicle, ...list]; // newest first, so it tops the inventory
  persist(next); // persist BEFORE updating the cache so a failed write isn't half-applied
  globalRef.__vehicleCache__ = next;
  return vehicle;
}

export function updateVehicleStatus(id: string, status: VehicleStatus): Vehicle | null {
  const list = load();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const updated = { ...list[index], status };
  const next = list.map((item, i) => (i === index ? updated : item));
  persist(next);
  globalRef.__vehicleCache__ = next;
  return updated;
}

export function deleteVehicle(id: string): boolean {
  const list = load();
  const next = list.filter((item) => item.id !== id);
  if (next.length === list.length) return false;
  persist(next);
  globalRef.__vehicleCache__ = next;
  return true;
}

/* ---------- uploaded photos ---------- */

const EXT_BY_TYPE = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const UPLOAD_NAME = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

/** Identify the real format from the file's first bytes, never from its name or MIME. */
function sniff(buf: Buffer): keyof typeof EXT_BY_TYPE | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function saveUpload(buf: Buffer): Promise<string> {
  if (buf.length > MAX_UPLOAD_BYTES) throw new VehicleError("Photo is larger than 8 MB.", 413);
  const ext = sniff(buf);
  if (!ext) throw new VehicleError("Only JPG, PNG or WebP photos are allowed.", 415);
  ensureDirs();
  // Random name: avoids collisions and means a user-supplied filename never touches disk.
  const name = `${randomUUID()}.${ext}`;
  await writeFile(join(UPLOAD_DIR, name), buf);
  return `/api/uploads/${name}`;
}

export async function readUpload(name: string): Promise<{ data: Buffer; type: string } | null> {
  if (!UPLOAD_NAME.test(name)) return null; // blocks ../ path traversal
  try {
    const data = await readFile(join(UPLOAD_DIR, name));
    return { data, type: EXT_BY_TYPE[name.split(".").pop() as keyof typeof EXT_BY_TYPE] };
  } catch {
    return null;
  }
}

export class VehicleError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
