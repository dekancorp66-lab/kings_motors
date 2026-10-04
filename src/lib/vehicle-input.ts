import { z } from "zod";
import type { Spec, Vehicle } from "@/data/types";

/**
 * Shared by the admin form (client) AND the API route (server).
 * Why one schema: the browser check gives instant feedback, the server check is the
 * real security boundary — keeping them identical means they can never disagree.
 */

export const VEHICLE_STATUSES = ["available", "pending", "sold"] as const;

// Images must live in our own folders. Why: stops someone saving a `javascript:` or
// third-party URL as an "image" through the API.
const IMAGE_URL = /^\/(images|api\/uploads)\/[A-Za-z0-9._\-/]+$/;

const text = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

export const vehicleInputSchema = z.object({
  make: text("Make", 60),
  model: text("Model", 60),
  trim: optionalText(60),
  year: z.coerce
    .number({ error: "Year must be a number" })
    .int("Year must be a whole number")
    .min(1950, "Year must be 1950 or later")
    .max(new Date().getFullYear() + 1, "Year is in the future"),
  price: z.coerce.number({ error: "Price must be a number" }).positive("Price must be above 0").max(100_000_000),
  mileage: z.coerce.number({ error: "Mileage must be a number" }).int().min(0, "Mileage cannot be negative").max(2_000_000),
  body: text("Body type", 40),
  fuel: text("Fuel", 40),
  transmission: text("Transmission", 60),
  drivetrain: optionalText(60),
  engine: optionalText(80),
  color: text("Exterior colour", 60),
  interiorColor: optionalText(60),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{5,20}$/, "VIN / chassis number must be 5–20 letters or digits"),
  status: z.enum(VEHICLE_STATUSES, { error: "Status must be available, pending or sold" }),
  badge: z.enum(["new", "reserved"]).optional(),
  featured: z.boolean().default(false),
  description: text("Description", 3000),
  // Optional technical extras, shown in the "technical" table on the detail page.
  horsepower: optionalText(40),
  torque: optionalText(40),
  zeroToSixty: optionalText(40),
  topSpeed: optionalText(40),
  // The first image is the card thumbnail / hero.
  images: z
    .array(z.string().regex(IMAGE_URL, "Invalid image path"))
    .min(1, "Add at least one photo")
    .max(12, "Maximum 12 photos"),
});

export type VehicleInput = z.input<typeof vehicleInputSchema>;
export type VehicleParsed = z.output<typeof vehicleInputSchema>;

/** First human-readable validation problem, for toasts. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message ?? "Please check the form.";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

/**
 * Turns the flat form fields into the full `Vehicle` shape the public pages expect.
 * Why derive `specs`/`technical` here: the admin types each fact once; the detail page
 * grids are generated, so they can never contradict the main fields.
 */
export function buildVehicle(input: VehicleParsed, id: string, slug: string): Vehicle {
  const specs: Spec[] = [
    { label: "Year", value: String(input.year) },
    { label: "Mileage", value: `${fmt(input.mileage)} Miles` },
    input.engine && { label: "Engine", value: input.engine },
    { label: "Fuel", value: input.fuel },
    { label: "Transmission", value: input.transmission },
    input.drivetrain && { label: "Drivetrain", value: input.drivetrain },
    { label: "Exterior Color", value: input.color },
    input.interiorColor && { label: "Interior Color", value: input.interiorColor },
  ].filter((row): row is Spec => Boolean(row));

  const technical: Spec[] = [
    input.horsepower && { label: "Horsepower", value: input.horsepower },
    input.torque && { label: "Torque", value: input.torque },
    input.zeroToSixty && { label: "0–60 mph", value: input.zeroToSixty },
    input.topSpeed && { label: "Top Speed", value: input.topSpeed },
  ].filter((row): row is Spec => Boolean(row));

  return {
    id,
    slug,
    name: `${input.make} ${input.model}`,
    make: input.make,
    model: input.model,
    trim: input.trim,
    year: input.year,
    price: input.price,
    mileage: input.mileage,
    body: input.body,
    fuel: input.fuel,
    transmission: input.transmission,
    drivetrain: input.drivetrain,
    engine: input.engine,
    color: input.color,
    vin: input.vin,
    status: input.status,
    ...(input.badge ? { badge: input.badge } : {}),
    featured: input.featured,
    description: input.description,
    images: input.images,
    specs,
    technical,
  };
}
