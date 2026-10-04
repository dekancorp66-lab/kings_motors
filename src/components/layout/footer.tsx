import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="bg-navy text-inverse">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-1">
          <p className="text-micro font-semibold tracking-mark uppercase">Meridian Motors</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-inverse/65">
            A private atelier for exceptional motorcars. Provenance, mechanical truth, and unhurried counsel since 2012.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-nav text-inverse/50 uppercase">Inventory</p>
          <ul className="mt-4 space-y-2.5 text-sm text-inverse/80">
            <li>
              <Link to="/inventory" className="hover:text-inverse">
                All vehicles
              </Link>
            </li>
            <li>
              <Link to="/inventory" search={{ body: "Sedan" }} className="hover:text-inverse">
                Sedans
              </Link>
            </li>
            <li>
              <Link to="/inventory" search={{ body: "Coupe" }} className="hover:text-inverse">
                Coupes
              </Link>
            </li>
            <li>
              <Link to="/inventory" search={{ body: "SUV" }} className="hover:text-inverse">
                SUVs
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-nav text-inverse/50 uppercase">Services</p>
          <ul className="mt-4 space-y-2.5 text-sm text-inverse/80">
            <li>
              <Link to="/services" className="hover:text-inverse">
                Vehicle sales
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-inverse">
                Sourcing
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-inverse">
                Atelier inspection
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-inverse">
                The atelier
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-nav text-inverse/50 uppercase">Stay in touch</p>
          <p className="mt-4 text-sm text-inverse/65">Private notes on new arrivals. Never a newsletter mill.</p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const email = String(new FormData(form).get("email") ?? "");
              if (!email.includes("@")) {
                toast.error("Please enter a valid email.");
                return;
              }
              form.reset();
              toast.success("You are on the atelier list.");
            }}
          >
            <Input
              name="email"
              type="email"
              required
              placeholder="Email address"
              className="h-10 bg-navy-mid text-inverse ring-inverse/15 placeholder:text-inverse/35"
            />
            <Button type="submit" size="sm" className="h-10 px-3" aria-label="Subscribe">
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </div>
      </div>
      <div className="border-t border-inverse/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-inverse/45 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} Meridian Motors. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/contact" className="hover:text-inverse">
              Privacy
            </Link>
            <Link to="/contact" className="hover:text-inverse">
              Terms of service
            </Link>
            <Link to="/curator/login" className="hover:text-inverse">
              Curator
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
