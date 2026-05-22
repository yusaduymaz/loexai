import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Button — vendorized.
 *
 * Variants map to DESIGN.md §Components → Buttons:
 *   - primary  : gradient primary→secondary, white text
 *   - secondary: ghost with 1px primary outline
 *   - ghost    : transparent, hover bg
 *   - link     : underlined inline link
 *   - destructive: error-container background
 *
 * Sizes follow `rounded-md` (8px) per DESIGN.md.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-body-sm transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-primary to-secondary text-on-primary shadow-[0_0_15px_rgba(0,217,255,0.3)] hover:shadow-[0_0_25px_rgba(0,217,255,0.5)] hover:scale-[1.02]",
        secondary:
          "border border-primary/30 bg-surface/30 backdrop-blur-sm text-primary hover:bg-surface/50 hover:border-primary/50",
        outline:
          "border border-outline-variant/50 text-on-surface hover:bg-surface-container-high",
        ghost:
          "text-on-surface-variant hover:text-primary hover:bg-surface-container/50",
        link: "text-primary underline-offset-4 hover:underline",
        destructive:
          "bg-error-container text-on-error-container hover:opacity-90",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-10 px-6",
        lg: "h-12 px-8 text-body-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
