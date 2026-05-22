import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Badge — vendorized.
 *
 * Pill-shaped per DESIGN.md §Shapes. Opportunity badges use semantic-color
 * background at 15% opacity + 100% text per DESIGN.md §Opportunity Badges.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-0.5 font-label-caps text-label-caps uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        neutral:
          "bg-surface-container-high text-on-surface-variant border border-outline-variant/40",
        primary: "bg-primary/15 text-primary",
        secondary: "bg-secondary/15 text-secondary",
        success: "bg-emerald-500/15 text-emerald-300",
        warning: "bg-amber-500/15 text-amber-300",
        danger: "bg-error-container/30 text-error",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
