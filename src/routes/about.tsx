import { createFileRoute } from "@tanstack/react-router";
import { Shield, Sparkles, Users } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/page-hero";
import { curators, pillars } from "@/data/catalog";

export const Route = createFileRoute("/about")({ component: AboutPage });

const PILLAR_ICONS = [Shield, Sparkles, Users];

function AboutPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="The house"
        title="About Meridian Motors"
        subtitle="Established in 2012. Curating superlative luxury motorcars for collectors and unhurried, permanent keepers — never a showroom of the ordinary."
        image="/images/about-hero.jpg"
      />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-2 lg:px-8">
        <div className="overflow-hidden rounded-2xl shadow-card">
          <img src="/images/showroom.jpg" alt="Meridian Motors showroom" className="aspect-4/3 w-full object-cover" />
        </div>
        <div>
          <p className="text-micro font-semibold tracking-mark text-accent uppercase">Atelier journal</p>
          <h2 className="mt-2 font-serif text-3xl text-ink md:text-4xl">A Story of Exceptional Curation</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Meridian Motors was founded with a simple necessity: to restore the honour of the motorcar transaction. In a
            market crowded with volume dealers and opaque auctions, we built a quieter room — one where every vehicle is
            read like a document, and every client is treated as a long correspondent.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            From a single bay in 2012, the atelier now advises families, foundations, and first-time keepers across the
            coast. The work has not changed: uncompromising vehicle history, and a slow, private process designed to
            outlast the handover.
          </p>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-14 md:grid-cols-4 lg:px-8">
          {[
            ["2,500+", "Vehicles sold"],
            ["98%", "Satisfaction rate"],
            ["15+", "Years experience"],
            ["500+", "Five-star reviews"],
          ].map(([stat, label]) => (
            <div key={label} className="text-center">
              <p className="font-serif text-4xl text-ink md:text-5xl">{stat}</p>
              <p className="mt-2 text-micro tracking-nav text-muted uppercase">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <p className="text-center text-micro font-semibold tracking-mark text-accent uppercase">
          Permanent character
        </p>
        <h2 className="mt-2 text-center font-serif text-3xl text-ink">Our Pillars of Conduct</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pillars.map((item, index) => {
            const Icon = PILLAR_ICONS[index] ?? Shield;
            return (
              <article key={item.title} className="rounded-2xl bg-surface p-7 shadow-card">
                <span className="grid size-11 place-items-center rounded-full bg-canvas text-accent">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <p className="text-center text-micro font-semibold tracking-mark text-accent uppercase">The desk</p>
          <h2 className="mt-2 text-center font-serif text-3xl text-ink">Meet Our Curators</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {curators.map((person) => (
              <article key={person.name} className="rounded-2xl bg-canvas p-6 text-center shadow-card">
                <img
                  src={person.image}
                  alt={person.name}
                  className="mx-auto size-28 rounded-full object-cover img-frame"
                />
                <h3 className="mt-4 text-base font-semibold text-ink">{person.name}</h3>
                <p className="text-sm text-muted">{person.role}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
