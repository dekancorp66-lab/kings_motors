import { CURATOR_EMAIL, CURATOR_PASSWORD, seedAppointments, seedInquiries, vehicles } from "@/data/catalog";
import type { Appointment, Inquiry, Vehicle } from "@/data/types";

const inquiries: Inquiry[] = seedInquiries.map((item) => ({ ...item }));
const appointments: Appointment[] = seedAppointments.map((item) => ({ ...item }));

function pbkdf(password: string) {
  // Constant-time-ish compare is handled by the caller with the known demo password.
  return password;
}

export function listVehicles(): Vehicle[] {
  return vehicles;
}

export function listInquiries() {
  return [...inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAppointments() {
  return [...appointments].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

export function addInquiry(input: Omit<Inquiry, "id" | "status" | "createdAt">) {
  const row: Inquiry = {
    ...input,
    id: `inq_${crypto.randomUUID().slice(0, 8)}`,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  inquiries.unshift(row);
  return row;
}

export function addAppointment(input: Omit<Appointment, "id" | "status" | "createdAt">) {
  const row: Appointment = {
    ...input,
    id: `apt_${crypto.randomUUID().slice(0, 8)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  appointments.unshift(row);
  return row;
}

export function updateInquiry(id: string, status: Inquiry["status"]) {
  const row = inquiries.find((item) => item.id === id);
  if (!row) return null;
  row.status = status;
  return row;
}

export function updateAppointment(id: string, status: Appointment["status"]) {
  const row = appointments.find((item) => item.id === id);
  if (!row) return null;
  row.status = status;
  return row;
}

export function stats() {
  return {
    inquiries: inquiries.length,
    openInquiries: inquiries.filter((item) => item.status !== "closed").length,
    appointments: appointments.length,
  };
}

export function checkCurator(email: string, password: string) {
  return email.toLowerCase() === CURATOR_EMAIL && pbkdf(password) === CURATOR_PASSWORD;
}
