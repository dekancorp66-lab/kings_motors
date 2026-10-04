import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/site-shell";
import { SearchPanel } from "@/components/search-panel";
import { VehicleCard } from "@/components/vehicle-card";
import { useVehicles } from "@/lib/vehicles";

export const Route = createFileRoute("/inventory/")({
  validateSearch: (search: Record<string, unknown>) => {
    const next: {
      make?: string;
      body?: string;
      fuel?: string;
      transmission?: string;
      yearMin?: string;
      yearMax?: string;
    } = {};
    if (typeof search.make === "string" && search.make) next.make = search.make;
    if (typeof search.body === "string" && search.body) next.body = search.body;
    if (typeof search.fuel === "string" && search.fuel) next.fuel = search.fuel;
    if (typeof search.transmission === "string" && search.transmission) next.transmission = search.transmission;
    if (typeof search.yearMin === "string" && search.yearMin) next.yearMin = search.yearMin;
    if (typeof search.yearMax === "string" && search.yearMax) next.yearMax = search.yearMax;
    return next;
  },
  component: InventoryPage,
});

function InventoryPage() {
  const filters = Route.useSearch();
  const vehicles = useVehicles();
  const list = vehicles.filter((vehicle) => {
    if (vehicle.status === "sold") return false;
    if (filters.make && vehicle.make !== filters.make) return false;
    if (filters.body && vehicle.body !== filters.body) return false;
    if (filters.fuel && vehicle.fuel !== filters.fuel) return false;
    if (filters.transmission && vehicle.transmission !== filters.transmission) return false;
    if (filters.yearMin && vehicle.year < Number(filters.yearMin)) return false;
    if (filters.yearMax && vehicle.year > Number(filters.yearMax)) return false;
    return true;
  });

  return (
    <SiteShell>
      <section className="bg-navy px-5 py-16 text-inverse">
        <div className="mx-auto max-w-6xl">
          <p className="text-micro font-semibold tracking-mark text-inverse/60 uppercase">The catalogue</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Inventory</h1>
          <p className="mt-3 max-w-xl text-sm text-inverse/70">
            Motorcars currently offered by the atelier. Every listing carries a completed inspection report.
          </p>
        </div>
      </section>
      <div className="px-5 pt-10 lg:px-8">
        <SearchPanel compact />
      </div>
      <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <p className="mb-6 text-sm text-muted">
          {list.length} {list.length === 1 ? "vehicle" : "vehicles"} available
        </p>
        {list.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-surface p-10 text-center shadow-card">
            <p className="font-serif text-2xl text-ink">No motorcars match those filters</p>
            <p className="mt-2 text-sm text-muted">Clear a criterion, or send an enquiry and we will source it.</p>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
