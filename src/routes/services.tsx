import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { services } from "@/data/catalog";

export const Route = createFileRoute("/services")({ component: ServicesPage });

function ServicesPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="The atelier practice"
        title="Our Services"
        subtitle="Providing uncompromising mechanical stewardship and bespoke client handling protocols. Every automotive transaction is treated as a commission."
        image="/images/services-hero.jpg"
      />
      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <p className="text-center text-micro font-semibold tracking-mark text-accent uppercase">
          Professional services
        </p>
        <h2 className="mt-2 text-center font-serif text-3xl text-ink">Professional Services</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((item) => (
            <article key={item.id} id={item.id} className="overflow-hidden rounded-2xl bg-surface shadow-card">
              <img src={item.image} alt="" className="aspect-16/10 w-full object-cover" />
              <div className="p-6">
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.summary}</p>
                <Link
                  to="/contact"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
                >
                  Learn more <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-serif text-3xl text-ink md:text-4xl">Ready to acquire your next motor?</h2>
          <p className="mt-3 text-sm text-muted">
            Get in touch with an atelier curator privately in order to initiate a confidential conversation.
          </p>
          <Button asChild className="mt-8">
            <Link to="/contact">Contact us</Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
