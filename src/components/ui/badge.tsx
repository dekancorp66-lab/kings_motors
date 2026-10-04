import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "accent" | "success" | "warning" | "muted";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-micro font-semibold tracking-wider uppercase",
        tone === "accent" && "bg-accent text-inverse",
        tone === "success" && "bg-success/15 text-success",
        tone === "warning" && "bg-warning/15 text-warning",
        tone === "muted" && "bg-line text-muted",
        tone === "neutral" && "bg-navy text-inverse",
        className,
      )}
    >
      {children}
    </span>
  );
}
