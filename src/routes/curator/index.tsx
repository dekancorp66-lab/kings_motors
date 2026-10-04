import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  Calendar,
  Car,
  Inbox,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddVehicleForm } from "@/components/curator/add-vehicle-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Appointment, Inquiry, Vehicle } from "@/data/types";
import {
  curatorLogout,
  curatorMe,
  fetchAppointments,
  fetchInquiries,
  patchAppointmentStatus,
  patchInquiryStatus,
  patchVehicleStatus,
  removeVehicle,
} from "@/lib/api";
import { useVehicles } from "@/lib/vehicles";
import { cn, formatDate, formatPrice } from "@/lib/utils";

export const Route = createFileRoute("/curator/")({ component: CuratorDesk });

type Pane = "dashboard" | "inventory" | "inquiries" | "appointments" | "settings";

function CuratorDesk() {
  const navigate = useNavigate();
  const router = useRouter();
  // Live stock from the root loader. After any change we call router.invalidate() to refetch it.
  const vehicles = useVehicles();
  const [adding, setAdding] = useState(false);
  const [ready, setReady] = useState(false);
  const [pane, setPane] = useState<Pane>("dashboard");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    let cancelled = false;
    void curatorMe()
      .then(async () => {
        const [inq, apt] = await Promise.all([fetchInquiries(), fetchAppointments()]);
        if (cancelled) return;
        setInquiries(inq);
        setAppointments(apt);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) void navigate({ to: "/curator/login" });
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const stats = useMemo(
    () => [
      { label: "Vehicles in stock", value: vehicles.filter((item) => item.status !== "sold").length },
      { label: "Open inquiries", value: inquiries.filter((item) => item.status !== "closed").length },
      { label: "Scheduled visits", value: appointments.filter((item) => item.status !== "completed").length },
      { label: "Sold", value: vehicles.filter((item) => item.status === "sold").length },
    ],
    [vehicles, inquiries, appointments],
  );

  async function changeStatus(vehicle: Vehicle, status: Vehicle["status"]) {
    try {
      await patchVehicleStatus(vehicle.id, status);
      await router.invalidate(); // refetch stock so the dashboard AND the public site update
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the status.");
    }
  }

  async function deleteVehicle(vehicle: Vehicle) {
    // Deleting is permanent, so ask first. (Marking it "sold" keeps the record.)
    if (!window.confirm(`Delete ${vehicle.year} ${vehicle.name} ${vehicle.trim}? This cannot be undone.`)) return;
    try {
      await removeVehicle(vehicle.id);
      await router.invalidate();
      toast.success("Vehicle deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the vehicle.");
    }
  }

  if (!ready) {
    return (
      <main className="grid min-h-svh place-items-center bg-canvas text-sm text-muted">
        Opening the desk…
      </main>
    );
  }

  return (
    <div className="flex min-h-svh bg-canvas text-ink">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <Link to="/" className="border-b border-line px-5 py-5 text-micro font-semibold tracking-mark uppercase">
          Meridian
        </Link>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {(
            [
              ["dashboard", LayoutDashboard, "Dashboard"],
              ["inventory", Car, "Inventory"],
              ["inquiries", Inbox, "Inquiries"],
              ["appointments", Calendar, "Appointments"],
              ["settings", Settings, "Settings"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPane(id)}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                pane === id ? "bg-canvas text-ink" : "text-muted hover:bg-canvas hover:text-ink",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="m-3 flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted hover:bg-canvas hover:text-ink"
          onClick={async () => {
            await curatorLogout();
            await navigate({ to: "/curator/login" });
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-5">
          <div className="flex gap-2 md:hidden">
            {(["dashboard", "inventory", "inquiries", "appointments"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPane(id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium capitalize",
                  pane === id ? "bg-navy text-inverse" : "bg-canvas text-muted",
                )}
              >
                {id}
              </button>
            ))}
          </div>
          <p className="hidden text-sm text-muted md:block">Atelier operating desk</p>
          <p className="text-sm font-medium">Curator</p>
        </header>

        <main className="flex-1 overflow-auto p-5 lg:p-8">
          {pane === "dashboard" || pane === "inventory" ? (
            <>
              {adding ? (
                <AddVehicleForm
                  existing={vehicles}
                  onCancel={() => setAdding(false)}
                  onCreated={async () => {
                    setAdding(false);
                    await router.invalidate();
                  }}
                />
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => (
                  <article key={item.label} className="rounded-2xl bg-surface p-5 shadow-card">
                    <p className="text-micro tracking-nav text-muted uppercase">{item.label}</p>
                    <p className="mt-2 font-serif text-4xl tabular-nums text-ink">{item.value}</p>
                  </article>
                ))}
              </div>
              <section className="mt-8 rounded-2xl bg-surface shadow-card">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <h2 className="text-sm font-semibold">Vehicle inventory</h2>
                  <div className="flex items-center gap-3">
                    <Badge tone="muted">{vehicles.length} listed</Badge>
                    <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
                      <Plus className="size-4" />
                      Add vehicle
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[44rem] text-left text-sm">
                    <thead className="text-micro tracking-nav text-muted uppercase">
                      <tr>
                        <th className="px-5 py-3 font-medium">Vehicle</th>
                        <th className="px-5 py-3 font-medium">Year</th>
                        <th className="px-5 py-3 font-medium">Price</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Mileage</th>
                        <th className="px-5 py-3 font-medium"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map((vehicle) => (
                        <tr key={vehicle.id} className="border-t border-line">
                          <td className="px-5 py-3">
                            <Link
                              to="/inventory/$slug"
                              params={{ slug: vehicle.slug }}
                              className="flex items-center gap-3 hover:text-accent"
                            >
                              <img src={vehicle.images[0]} alt="" className="size-11 rounded-md object-cover" />
                              <span>
                                <span className="block font-medium">
                                  {vehicle.name} {vehicle.trim}
                                </span>
                                <span className="text-xs text-muted">{vehicle.vin}</span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-5 py-3 tabular-nums">{vehicle.year}</td>
                          <td className="px-5 py-3 tabular-nums">{formatPrice(vehicle.price)}</td>
                          <td className="px-5 py-3">
                            <select
                              aria-label={`Status of ${vehicle.name}`}
                              className="h-9 rounded-md bg-canvas px-2 text-xs ring-1 ring-line"
                              value={vehicle.status}
                              onChange={(event) => void changeStatus(vehicle, event.target.value as Vehicle["status"])}
                            >
                              <option value="available">available</option>
                              <option value="pending">pending</option>
                              <option value="sold">sold</option>
                            </select>
                          </td>
                          <td className="px-5 py-3 tabular-nums text-muted">
                            {vehicle.mileage.toLocaleString()} mi
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              aria-label={`Delete ${vehicle.name}`}
                              className="inline-grid size-9 place-items-center rounded-md text-muted hover:bg-canvas hover:text-ink"
                              onClick={() => void deleteVehicle(vehicle)}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}

          {pane === "dashboard" ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <EnquiryList
                inquiries={inquiries.slice(0, 5)}
                onStatus={async (id, status) => {
                  await patchInquiryStatus(id, status);
                  setInquiries((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
                }}
              />
              <AppointmentList appointments={appointments.slice(0, 5)} />
            </div>
          ) : null}

          {pane === "inquiries" ? (
            <EnquiryList
              inquiries={inquiries}
              onStatus={async (id, status) => {
                await patchInquiryStatus(id, status);
                setInquiries((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
              }}
            />
          ) : null}

          {pane === "appointments" ? (
            <AppointmentList
              appointments={appointments}
              onStatus={async (id, status) => {
                await patchAppointmentStatus(id, status);
                setAppointments((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
              }}
            />
          ) : null}

          {pane === "settings" ? (
            <section className="max-w-lg rounded-2xl bg-surface p-6 shadow-card">
              <h2 className="font-serif text-2xl">Desk settings</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Sessions expire after eight hours. Passwords are hashed with PBKDF2, login attempts are rate-limited,
                and the session cookie is httpOnly. Public enquiries never expose other clients’ details.
              </p>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "available" || status === "confirmed" || status === "open"
    ? "success"
    : status === "pending" || status === "new"
      ? "warning"
      : status === "sold" || status === "closed" || status === "completed"
        ? "muted"
        : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

function EnquiryList({
  inquiries,
  onStatus,
}: {
  inquiries: Inquiry[];
  onStatus: (id: string, status: Inquiry["status"]) => Promise<void>;
}) {
  return (
    <section className="rounded-2xl bg-surface shadow-card">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold">Recent inquiries</h2>
      </div>
      <ul className="divide-y divide-line">
        {inquiries.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {item.firstName} {item.lastName}
              </p>
              <p className="text-xs text-muted">
                {item.vehicle || "General"} · {formatDate(item.createdAt)}
              </p>
            </div>
            <select
              className="h-9 rounded-md bg-canvas px-2 text-xs ring-1 ring-line"
              value={item.status}
              onChange={(event) => void onStatus(item.id, event.target.value as Inquiry["status"])}
            >
              <option value="new">new</option>
              <option value="open">open</option>
              <option value="closed">closed</option>
            </select>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AppointmentList({
  appointments,
  onStatus,
}: {
  appointments: Appointment[];
  onStatus?: (id: string, status: Appointment["status"]) => Promise<void>;
}) {
  return (
    <section className="rounded-2xl bg-surface shadow-card">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold">Upcoming appointments</h2>
      </div>
      <ul className="divide-y divide-line">
        {appointments.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted">
                {item.date} · {item.time} · {item.vehicle || "Showroom"}
              </p>
            </div>
            {onStatus ? (
              <select
                className="h-9 rounded-md bg-canvas px-2 text-xs ring-1 ring-line"
                value={item.status}
                onChange={(event) => void onStatus(item.id, event.target.value as Appointment["status"])}
              >
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="completed">completed</option>
              </select>
            ) : (
              <StatusBadge status={item.status} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
