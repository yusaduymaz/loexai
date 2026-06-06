import Link from "next/link";
import { ArrowUpRight, Github, Linkedin, Twitter } from "lucide-react";

const productLinks = [
  { label: "Platform", href: "/#preview" },
  { label: "Pipeline", href: "/#pipeline" },
  { label: "Workflow", href: "/#how" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

const companyLinks = [
  { label: "Contact", href: "mailto:hello@loexai.com" },
  { label: "Register", href: "/register" },
  { label: "Log in", href: "/login" },
];

const resourceLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Status", href: "https://status.loexai.com" },
];

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-outline-variant/20 bg-[#020c19] px-margin-mobile py-16 md:px-margin-desktop">
      {/* Soft top glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-[60%] rounded-full bg-secondary/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-container-max gap-12 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-outline-variant/20 bg-gradient-to-br from-surface-container-low to-surface-container-high text-lg text-on-background [font-family:var(--font-editorial-serif)]">
              L
            </span>
            <span className="text-3xl text-on-background [font-family:var(--font-editorial-serif)]">
              LoexAI
            </span>
          </Link>
          <p className="mt-5 max-w-md text-base leading-7 text-on-surface-variant">
            A more disciplined way to find local opportunities, articulate the
            gap, and hand the work to delivery with clarity.
          </p>
          <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/55">
            Built for agencies, freelancers, and local growth operators
          </p>

          <div className="mt-6 flex items-center gap-3">
            {[
              { Icon: Twitter, href: "https://twitter.com/loexai", label: "Twitter" },
              { Icon: Linkedin, href: "https://linkedin.com/company/loexai", label: "LinkedIn" },
              { Icon: Github, href: "https://github.com/loexai", label: "GitHub" },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-outline-variant/20 bg-surface-container-low/60 text-on-surface-variant transition-colors hover:border-secondary/40 hover:text-secondary"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title="Product" links={productLinks} />
        <FooterColumn title="Company" links={companyLinks} />
        <FooterColumn title="Resources" links={resourceLinks} />
      </div>

      <div className="relative mx-auto mt-12 flex max-w-container-max flex-col gap-3 border-t border-outline-variant/15 pt-6 text-sm text-on-surface-variant md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} LoexAI. All rights reserved.</p>
        <a
          href="mailto:hello@loexai.com"
          className="inline-flex items-center gap-1 transition-colors hover:text-on-background"
        >
          hello@loexai.com
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
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
      <h4 className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/70">
        {title}
      </h4>
      <ul className="mt-5 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-on-surface-variant transition-colors hover:text-on-background"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
