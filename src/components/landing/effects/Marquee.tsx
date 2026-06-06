import { cn } from "@/lib/utils";

/**
 * Infinite horizontal marquee. Renders children twice for seamless looping.
 *
 *   <Marquee>
 *     {items.map(...)}
 *   </Marquee>
 *
 * Wrap each child with whatever gutter / sizing you need; Marquee provides
 * only the loop, the mask, and the animation.
 */
export function Marquee({
  children,
  className,
  pauseOnHover = true,
  reverse = false,
  speed = "default",
}: {
  children: React.ReactNode;
  className?: string;
  pauseOnHover?: boolean;
  reverse?: boolean;
  speed?: "default" | "slow";
}) {
  return (
    <div
      className={cn(
        "group relative flex w-full overflow-hidden mask-fade-x",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-12 pr-12",
          speed === "slow" ? "animate-marquee-x-slow" : "animate-marquee-x",
          reverse ? "[animation-direction:reverse]" : "",
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : "",
        )}
        aria-hidden={false}
      >
        {children}
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center gap-12 pr-12",
          speed === "slow" ? "animate-marquee-x-slow" : "animate-marquee-x",
          reverse ? "[animation-direction:reverse]" : "",
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : "",
        )}
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  );
}
