import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg bg-surface px-3.5 text-sm text-ink ring-1 ring-line outline-none transition-[box-shadow,background-color] duration-150 placeholder:text-subtle focus:ring-2 focus:ring-accent",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-lg bg-surface bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 fill=%22none%22 stroke=%22%23667085%22 stroke-width=%221.6%22><path d=%22M1 1.5 6 6.5 11 1.5%22/></svg>')] bg-[length:12px] bg-[right_14px_center] bg-no-repeat px-3.5 pr-9 text-sm text-ink ring-1 ring-line outline-none transition-[box-shadow] duration-150 focus:ring-2 focus:ring-accent",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg bg-surface px-3.5 py-3 text-sm text-ink ring-1 ring-line outline-none transition-[box-shadow] duration-150 placeholder:text-subtle focus:ring-2 focus:ring-accent",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-medium tracking-wide text-muted", className)}
      {...props}
    />
  );
}
