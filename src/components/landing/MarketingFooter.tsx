import Link from "next/link";

const productLinks = [
  { label: "Product", href: "/#how" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/#faq" },
];

const resourceLinks = [
  { label: "About", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Contact", href: "mailto:hello@loexai.com" },
];

const legalLinks = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
];

export function MarketingFooter() {
  return (
    <footer className="relative z-20 border-t border-outline-variant/30 bg-surface-container-lowest px-margin-mobile pb-stack-lg pt-stack-xl md:px-margin-desktop">
      <div className="mx-auto grid max-w-container-max grid-cols-1 gap-stack-lg pb-stack-xl md:grid-cols-4">
        <div>
          <span className="mb-stack-md block font-headline-lg text-2xl font-semibold tracking-tight text-primary">
            LoexAI
          </span>
          <p className="text-body-sm leading-relaxed text-on-surface-variant">
            Local Opportunity Engine — find the right business, pinpoint the
            right gap, ship the right pitch.
          </p>
          <p className="mt-stack-md font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant/70">
            Made with intent.
          </p>
        </div>
        <FooterColumn title="Product" links={productLinks} />
        <FooterColumn title="Resources" links={resourceLinks} />
        <FooterColumn title="Legal" links={legalLinks} />
      </div>

      <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-stack-md border-t border-outline-variant/30 pt-stack-lg md:flex-row">
        <p className="text-body-sm text-on-surface-variant">
          © {new Date().getFullYear()} LoexAI. All rights reserved.
        </p>
        <a
          href="mailto:hello@loexai.com"
          className="text-body-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          hello@loexai.com
        </a>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h4 className="mb-stack-md font-title-md text-body-lg text-on-surface">
        {title}
      </h4>
      <ul className="flex flex-col gap-stack-sm">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-body-sm text-on-surface-variant transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
