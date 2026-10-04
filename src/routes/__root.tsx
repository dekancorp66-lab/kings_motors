import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Providers } from "@/components/providers";
import { getVehicles } from "@/lib/vehicles";
import appCss from "../styles.css?url";

const APP_NAME = "Meridian Motors";

export const Route = createRootRoute({
  loader: () => getVehicles(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Meridian Motors is a private atelier for exceptional motorcars — provenance, mechanical truth, and unhurried counsel.",
      },
      { name: "theme-color", content: "#0B1727" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Outfit:wght@300;400;500;600;700;800&display=swap",
      },
    ],
  }),
  component: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument() {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Providers>
            <Outlet />
          </Providers>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-canvas px-6 text-center text-ink">
      <div>
        <p className="text-micro font-semibold tracking-mark uppercase text-muted">404</p>
        <h1 className="mt-3 font-serif text-4xl">This page is not in the catalogue</h1>
        <p className="mt-3 text-sm text-muted">The motorcar or page you requested is no longer listed.</p>
        <a href="/" className="mt-6 inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm text-inverse">
          Return home
        </a>
      </div>
    </main>
  );
}
