import { createFileRoute } from "@tanstack/react-router";
import { EnquiryForm } from "@/components/enquiry-form";
import { SiteShell } from "@/components/layout/site-shell";
import { atelier } from "@/data/catalog";
import { useVehicles } from "@/lib/vehicles";

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>) => {
    if (typeof search.vehicle === "string" && search.vehicle) return { vehicle: search.vehicle };
    return {};
  },
  component: ContactPage,
});

function ContactPage() {
  const { vehicle: slug } = Route.useSearch();
  const vehicles = useVehicles();
  const match = vehicles.find((item) => item.slug === slug);
  const defaultVehicle = match ? `${match.year} ${match.name} ${match.trim}` : "";

  return (
    <SiteShell>
      <section className="bg-navy px-5 py-16 text-inverse">
        <div className="mx-auto max-w-6xl">
          <p className="text-micro font-semibold tracking-mark text-inverse/60 uppercase">Correspondence</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Contact</h1>
          <p className="mt-3 max-w-xl text-sm text-inverse/70">
            Write to the atelier. A curator reads every message. We do not use chatbots for first contact.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <aside className="rounded-2xl bg-surface p-7 shadow-card">
          <h2 className="font-serif text-2xl text-ink">The atelier</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">{atelier.address.join("\n")}</p>
          <p className="mt-4 text-sm text-ink">{atelier.phone}</p>
          <p className="text-sm text-ink">{atelier.email}</p>
          <div className="mt-6 space-y-1 text-sm text-muted">
            {atelier.hours.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </aside>
        <div className="rounded-2xl bg-surface p-6 shadow-card md:p-8">
          <h2 className="font-serif text-2xl text-ink">Send a Direct Enquiry</h2>
          <div className="mt-6">
            <EnquiryForm defaultVehicle={defaultVehicle} />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
