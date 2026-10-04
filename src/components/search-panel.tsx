import { useNavigate } from "@tanstack/react-router";
import { uniqueSorted, useVehicles } from "@/lib/vehicles";
import { Button } from "./ui/button";
import { Label, Select } from "./ui/input";

export function SearchPanel({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const vehicles = useVehicles();
  // Options are built from the live stock, so a newly added make/body/year shows up in the filters.
  const makes = uniqueSorted(vehicles.map((item) => item.make));
  const bodies = uniqueSorted(vehicles.map((item) => item.body));
  const fuels = uniqueSorted(vehicles.map((item) => item.fuel));
  const transmissions = uniqueSorted(vehicles.map((item) => item.transmission));
  const years = [...new Set(vehicles.map((item) => item.year))].sort();

  return (
    <section className={compact ? "" : "-mt-10 relative z-10 px-5 lg:px-8"}>
      <form
        className="mx-auto max-w-6xl rounded-2xl bg-surface p-6 shadow-lift md:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void navigate({
            to: "/inventory",
            search: {
              ...(String(data.get("make") ?? "") ? { make: String(data.get("make")) } : {}),
              ...(String(data.get("body") ?? "") ? { body: String(data.get("body")) } : {}),
              ...(String(data.get("fuel") ?? "") ? { fuel: String(data.get("fuel")) } : {}),
              ...(String(data.get("transmission") ?? "")
                ? { transmission: String(data.get("transmission")) }
                : {}),
              ...(String(data.get("yearMin") ?? "") ? { yearMin: String(data.get("yearMin")) } : {}),
              ...(String(data.get("yearMax") ?? "") ? { yearMax: String(data.get("yearMax")) } : {}),
            },
          });
        }}
      >
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-accent uppercase">
              The catalogue
            </p>
            <h2 className="mt-1 font-serif text-2xl text-ink md:text-3xl">Find Your Perfect Vehicle</h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Make" name="make" options={makes} />
          <Field label="Body" name="body" options={bodies} />
          <Field label="Year min" name="yearMin" options={years.map(String)} placeholder="No minimum" />
          <Field label="Year max" name="yearMax" options={years.map(String)} placeholder="No maximum" />
          <Field label="Fuel" name="fuel" options={fuels} />
          <Field label="Transmission" name="transmission" options={transmissions} />
          <div className="sm:col-span-2 lg:col-span-3 flex items-end">
            <Button type="submit" className="h-11 w-full lg:w-auto lg:min-w-48">
              Search vehicles
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  options,
  placeholder = "All",
}: {
  label: string;
  name: string;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Select id={name} name={name} defaultValue="">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  );
}
