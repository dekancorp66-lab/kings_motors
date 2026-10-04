import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,color,box-shadow,transform,opacity] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        primary: "bg-accent text-inverse hover:bg-accent-hover",
        navy: "bg-navy text-inverse hover:bg-navy-mid",
        outline: "bg-surface text-ink ring-1 ring-line hover:bg-canvas",
        ghost: "bg-transparent text-ink hover:bg-canvas",
        inverse:
          "bg-transparent text-inverse ring-1 ring-inverse/35 hover:bg-inverse/10",
      },
      size: {
        sm: "h-9 rounded-md px-3.5 text-xs tracking-wide",
        md: "h-11 rounded-lg px-5 text-sm",
        lg: "h-12 rounded-lg px-6 text-sm tracking-wide",
        pill: "h-10 rounded-full px-5 text-xs font-semibold tracking-wider",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
