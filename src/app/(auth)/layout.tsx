/**
 * Auth route-group layout. Minimal — children carry their own AuthShell.
 *
 * Kept as a thin wrapper so we can later attach metadata or theming without
 * touching every auth page.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-background text-on-background">{children}</div>;
}
