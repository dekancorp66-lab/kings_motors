import { vehicles as catalogVehicles, seedAppointments, seedInquiries } from "@/data/catalog";
import type { Appointment, Inquiry, Vehicle } from "@/data/types";
import type { VehicleInput } from "@/lib/vehicle-input";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { detail: text };
    }
  }
  if (!response.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : "Request failed.";
    throw new Error(detail);
  }
  return data as T;
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  try {
    const data = await request<{ vehicles: Vehicle[] }>("/api/vehicles");
    if (Array.isArray(data.vehicles) && data.vehicles.length) return data.vehicles;
  } catch {
    /* catalog fallback */
  }
  return catalogVehicles;
}

export async function submitInquiry(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicle: string;
  message: string;
}) {
  return request<{ id: string; status: string }>("/api/inquiries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function submitAppointment(input: {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  vehicle: string;
  notes: string;
}) {
  return request<{ id: string; status: string }>("/api/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function curatorLogin(email: string, password: string) {
  const data = await request<{ curator: { email: string; name: string } }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data.curator;
}

export async function curatorMe() {
  return request<{ curator: { email: string; name: string } }>("/api/me");
}

export async function curatorLogout() {
  try {
    await request("/api/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
}

export async function fetchInquiries(): Promise<Inquiry[]> {
  try {
    const data = await request<{ inquiries: Inquiry[] }>("/api/inquiries");
    return data.inquiries;
  } catch {
    return seedInquiries;
  }
}

export async function fetchAppointments(): Promise<Appointment[]> {
  try {
    const data = await request<{ appointments: Appointment[] }>("/api/appointments");
    return data.appointments;
  } catch {
    return seedAppointments;
  }
}

export async function fetchStats() {
  try {
    return await request<{ inquiries: number; openInquiries: number; appointments: number }>(
      "/api/stats",
    );
  } catch {
    return {
      inquiries: seedInquiries.length,
      openInquiries: seedInquiries.filter((item) => item.status !== "closed").length,
      appointments: seedAppointments.length,
    };
  }
}

export async function patchInquiryStatus(id: string, status: Inquiry["status"]) {
  return request(`/api/inquiries/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function patchAppointmentStatus(id: string, status: Appointment["status"]) {
  return request(`/api/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/* ---------- vehicle management (curator only) ---------- */

export async function createVehicle(input: VehicleInput) {
  const data = await request<{ vehicle: Vehicle }>("/api/vehicles", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.vehicle;
}

export async function patchVehicleStatus(id: string, status: Vehicle["status"]) {
  return request(`/api/vehicles/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function removeVehicle(id: string) {
  return request(`/api/vehicles/${id}`, { method: "DELETE" });
}

/** Uploads one photo and returns the URL to store on the vehicle. */
export async function uploadVehiclePhoto(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  // No Content-Type header on purpose: the browser must add the multipart boundary itself.
  const data = await request<{ url: string }>("/api/uploads", { method: "POST", body });
  return data.url;
}
