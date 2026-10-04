export type VehicleStatus = "available" | "pending" | "sold";

export type Spec = { label: string; value: string };

export type Vehicle = {
  id: string;
  slug: string;
  name: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  price: number;
  mileage: number;
  body: string;
  fuel: string;
  transmission: string;
  drivetrain: string;
  engine: string;
  color: string;
  vin: string;
  status: VehicleStatus;
  badge?: "new" | "reserved";
  featured: boolean;
  description: string;
  images: string[];
  specs: Spec[];
  technical: Spec[];
};

export type Inquiry = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicle: string;
  message: string;
  status: "new" | "open" | "closed";
  createdAt: string;
};

export type Appointment = {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  vehicle: string;
  notes: string;
  status: "confirmed" | "pending" | "completed";
  createdAt: string;
};
