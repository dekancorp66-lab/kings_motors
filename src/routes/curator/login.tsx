import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CURATOR_EMAIL, CURATOR_PASSWORD } from "@/data/catalog";
import { curatorLogin } from "@/lib/api";

export const Route = createFileRoute("/curator/login")({ component: CuratorLogin });

function CuratorLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <main className="grid min-h-svh place-items-center bg-canvas px-5">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-lift">
        <p className="text-micro font-semibold tracking-mark text-muted uppercase">Staff access</p>
        <h1 className="mt-2 font-serif text-3xl text-ink">Curator desk</h1>
        <p className="mt-2 text-sm text-muted">Sign in to the atelier operating system.</p>
        <form
          className="mt-8 grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setPending(true);
            setError("");
            try {
              await curatorLogin(String(data.get("email")), String(data.get("password")));
              await navigate({ to: "/curator" });
            } catch (err) {
              setError(err instanceof Error ? err.message : "Unable to sign in.");
            } finally {
              setPending(false);
            }
          }}
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="username" defaultValue={CURATOR_EMAIL} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              defaultValue={CURATOR_PASSWORD}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Enter the desk"}
          </Button>
        </form>
        <p className="mt-6 text-xs leading-relaxed text-muted">
          Demo access is prefilled. In production this desk is limited to atelier staff and protected by hashed
          credentials, rate limiting, and an httpOnly session.
        </p>
      </div>
    </main>
  );
}
