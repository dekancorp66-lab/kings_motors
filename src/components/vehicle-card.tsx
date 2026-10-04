import { Link } from "@tanstack/react-router";
import type { Vehicle } from "@/data/types";
import { formatPrice } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-surface shadow-card transition-[box-shadow,transform] duration-200 ease-out hover:shadow-lift">
      <Link to="/inventory/$slug" params={{ slug: vehicle.slug }} className="block">
        <div className="relative aspect-16/10 overflow-hidden bg-navy">
          <img
            src={vehicle.images[0]}
            alt={`${vehicle.year} ${vehicle.name} ${vehicle.trim}`}
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          {vehicle.badge === "new" ? (
            <Badge tone="accent" className="absolute top-3 left-3">
              New
            </Badge>
          ) : null}
        </div>
      </Link>
      <div className="px-5 pt-5 pb-5">
        <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted uppercase">{vehicle.name}</p>
        <h3 className="mt-1 font-serif text-xl text-ink">{vehicle.trim}</h3>
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="text-lg font-semibold tabular-nums text-ink">{formatPrice(vehicle.price)}</p>
          <Button asChild size="sm">
            <Link to="/inventory/$slug" params={{ slug: vehicle.slug }}>
              Details
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
