# LoexAI MCP And Tooling Plan

## Goal

Give Codex a high-signal, low-risk tool surface for building LoexAI professionally without turning MCP into an uncontrolled privilege channel.

## Recommended MCP Set

### Tier 1: Install Immediately

These directly improve delivery quality for this repo.

1. OpenAI Developer Docs MCP
   - Purpose: official Codex/OpenAI/API docs lookup
   - Source: OpenAI official docs MCP
   - Why: removes stale-memory risk for OpenAI/Codex specifics

2. Supabase MCP
   - Purpose: inspect schema, logs, migrations, generate types, run SQL in controlled environments
   - Source: Supabase official MCP
   - Why: this repo is Supabase-centered
   - Safety mode: prefer project-scoped and read-only except during deliberate migration work

3. GitHub MCP
   - Purpose: issues, PRs, docs, repo metadata
   - Source: GitHub official MCP
   - Why: useful for upstream package/repo investigation and issue-driven development

4. Vercel MCP
   - Purpose: deployments, logs, project management, docs
   - Source: Vercel official MCP
   - Why: deployment target is Vercel

5. Playwright MCP
   - Purpose: end-to-end UI verification on real pages
   - Source: Playwright official MCP
   - Why: essential for dashboard/report workflow verification

### Tier 2: Install When Corresponding Phase Starts

1. Stripe MCP
   - Install when billing starts
   - Keep test-mode credentials only until Phase 6

2. Cloudflare MCP
   - Install only if Cloudflare becomes part of DNS, WAF, Workers, or edge runtime strategy

### Not Recommended Yet

- Broad write-capable infra MCPs that are not part of the current deployment path
- Community MCP servers for critical infrastructure when official servers exist
- Production DB mutation via MCP without a change-management rule

## Recommended Governance Rules

### Access Policy

- Supabase MCP should default to project-scoped access.
- Use read-only mode by default where supported.
- Production credentials must not be used for exploratory sessions.
- Billing and deployment tools should require human confirmation on state-changing actions.

### Session Policy

- Docs/search MCPs can stay broadly enabled.
- Destructive or write-capable MCPs should be enabled only in implementation sessions that need them.
- Keep browser automation isolated to verification tasks.

## LoexAI-Specific MCP Usage Matrix

| Domain | Best MCP | Usage |
|---|---|---|
| OpenAI/Codex/API docs | OpenAI Docs | fetch current official docs |
| DB schema, logs, migrations | Supabase | inspect and manage project database |
| Deployments and runtime logs | Vercel | inspect deploy health and logs |
| Repo/issue research | GitHub | issue-driven research and upstream references |
| UI verification | Playwright | E2E checks on dashboard/report flows |
| Billing ops | Stripe | subscriptions and billing workflows |

## Installation Order

1. OpenAI Docs
2. Supabase
3. Vercel
4. GitHub
5. Playwright
6. Stripe when billing begins

## Current Machine Status

Configured in Codex on this machine:

- `openaiDeveloperDocs`
- `supabase`
- `vercel`
- `github`
- `playwright`
- `stripe`

Notes:

- HTTP MCPs may still require login or token configuration before useful access.
- `playwright` is configured as a stdio MCP via `npx @playwright/mcp@latest`.
- These were added to Codex global MCP config, not only this repo.

## Post-Install Validation

After each MCP server is added:

1. Restart Codex if required.
2. Verify it appears in `codex mcp list`.
3. Authenticate if the server requires OAuth.
4. Run one harmless validation prompt:
   - OpenAI Docs: search a Codex config topic
   - Supabase: list tables
   - Vercel: list projects or search docs
   - GitHub: inspect repo metadata
   - Playwright: open a safe local or demo page

## Official References

- OpenAI Docs MCP: `https://developers.openai.com/mcp`
- Supabase MCP: `https://mcp.supabase.com/mcp`
- Vercel MCP: `https://mcp.vercel.com`
- GitHub MCP: `https://api.githubcopilot.com/mcp/`
- Stripe MCP: `https://mcp.stripe.com`
