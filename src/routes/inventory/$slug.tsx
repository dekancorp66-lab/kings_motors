import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVehicles } from "@/lib/vehicles";
import { cn, formatPrice } from "@/lib/utils";

export const Route = createFileRoute("/inventory/$slug")({
  loader: async ({ params }) => {
    const vehicle = (await getVehicles()).find((item) => item.slug === params.slug);
    if (!vehicle) throw notFound();
    return { vehicle };
  },
  component: VehicleDetail,
});

function VehicleDetail() {
  const { vehicle } = Route.useLoaderData();
  const [active, setActive] = useState(0);
  const image = vehicle.images[active] ?? vehicle.images[0];

  return (
    <SiteShell>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div>
          <div className="overflow-hidden rounded-2xl bg-navy shadow-card">
            <img
              src={image}
              alt={`${vehicle.year} ${vehicle.name} ${vehicle.trim}`}
              className="aspect-16/10 w-full object-cover"
            />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
            {vehicle.images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-canvas transition-[box-shadow] duration-150",
                  index === active ? "ring-accent" : "ring-transparent hover:ring-line",
                )}
              >
                <img src={src} alt="" className="aspect-4/3 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          {vehicle.badge === "new" ? <Badge tone="accent">New arrival</Badge> : null}
          <p className="mt-3 text-sm text-muted">{vehicle.year}</p>
          <h1 className="font-serif text-3xl text-ink md:text-4xl">
            {vehicle.name} {vehicle.trim}
          </h1>
          <p className="mt-4 text-3xl font-semibold tabular-nums text-ink">{formatPrice(vehicle.price)}</p>
          <p className="mt-5 text-sm leading-relaxed text-muted">{vehicle.description}</p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-6">
            {vehicle.specs.map((spec) => (
              <div key={spec.label}>
                <dt className="text-micro tracking-nav text-subtle uppercase">{spec.label}</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/contact" search={{ vehicle: vehicle.slug }}>
                Contact dealer
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 lg:px-8">
        <div className="rounded-2xl bg-surface p-6 shadow-card md:p-10">
          <h2 className="font-serif text-2xl text-ink md:text-3xl">Technical Specifications</h2>
          <dl className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {vehicle.technical.map((spec) => (
              <div key={spec.label} className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <dt className="text-sm text-muted">{spec.label}</dt>
                <dd className="text-sm font-semibold text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </SiteShell>
  );
}
