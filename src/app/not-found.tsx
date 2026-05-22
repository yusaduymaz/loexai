import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-margin-mobile md:px-margin-desktop">
      <div className="max-w-md text-center space-y-stack-md">
        <p className="font-label-caps text-xs uppercase tracking-wider text-on-surface-variant">
          404
        </p>
        <h1 className="font-headline-lg text-3xl md:text-4xl font-semibold text-on-surface">
          Sayfa bulunamadı
        </h1>
        <p className="font-body-lg text-on-surface-variant">
          Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-4 py-2 text-on-primary font-medium hover:opacity-90 transition-opacity"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}
