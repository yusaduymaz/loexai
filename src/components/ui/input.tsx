import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Input — vendorized.
 *
 * Style: Deep navy bg, 1px slate border, focus → primary border + cyan glow.
 * Aligned to DESIGN.md §Components → Input Fields.
 */
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-outline-variant/60 bg-surface-container-low/70 px-4 py-2 text-body-sm text-on-surface placeholder:text-on-surface-variant/60 backdrop-blur-sm transition-all",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_rgba(0,217,255,0.15)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
