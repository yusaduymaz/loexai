# LoexAI Multi-Agent Delivery Pipeline

## Objective

Set up a professional agent workflow that mirrors LoexAI's architecture instead of creating random parallelism.

## Core Rule

Agents orchestrate work. They do not replace deterministic services.

There are two separate meanings of "agent" in this project:

1. Product pipeline stages
2. Development-time coding/research agents

This document concerns the second.

## Recommended Development Agent Topology

### Orchestrator

Single senior orchestrator responsible for:

- reading `CLAUDE.md`
- selecting the current phase
- sequencing work
- resolving tradeoffs
- approving completion gates

### Specialist Agents

1. Repo Architect
   - owns boundaries, contracts, module placement

2. Data Engineer
   - owns Supabase schema, migrations, RLS, type generation

3. Discovery Engineer
   - owns provider adapters, retries, dedupe, raw normalization

4. Enrichment Engineer
   - owns deterministic website analysis and technical checks

5. Scoring Engineer
   - owns rule engine, weights, deterministic scoring outputs

6. AI Systems Engineer
   - owns provider abstraction, prompt files, schema validation, retries

7. Workflow Engineer
   - owns queue orchestration, idempotency, resume/retry semantics

8. Frontend Product Engineer
   - owns dashboard/report UX and admin surfaces

9. QA / Verification Agent
   - owns tests, logs, E2E validation, regression checks

10. Ops / Observability Engineer
   - owns telemetry, error handling, Sentry, analytics, runbooks

## Execution Pattern

### For a New Phase

1. Orchestrator defines scope and exit criteria.
2. Repo Architect validates where code should live.
3. Parallel research agents inspect only bounded areas.
4. Worker agents implement disjoint slices.
5. Verification agent validates behavior.
6. Orchestrator integrates and closes the phase.

### Golden Rule For Parallelism

Parallelize only when write scopes do not overlap.

Good parallel split:

- worker A: `src/lib/discovery/*`
- worker B: `src/lib/enrichment/*`
- worker C: `src/lib/scoring/*`

Bad parallel split:

- multiple workers editing the same pipeline orchestrator and shared domain types simultaneously

## Recommended Artifacts Per Phase

Each major phase should produce:

- `PLAN.md` or phase plan doc
- contract list
- task checklist
- risk list
- verification notes

## Verification Lanes

Every implementation phase should have these lanes:

1. Contract verification
   - types, schemas, DB contracts

2. Runtime verification
   - logs, retries, error paths

3. User-flow verification
   - dashboard to report behavior

4. Cost verification
   - token and provider usage

## LoexAI-Specific Work Breakdown

### Workstream 1: Platform Hardening

- config
- env validation
- observability
- analytics

### Workstream 2: Discovery

- providers
- normalization
- scan jobs

### Workstream 3: Deterministic Intelligence

- enrichment
- gap analysis
- scoring

### Workstream 4: AI Layer

- provider abstraction
- prompts
- schemas
- usage logging

### Workstream 5: Product Experience

- discovery UI
- jobs UI
- report page
- admin controls

### Workstream 6: Monetization And Operations

- billing
- quotas
- support tooling

## Completion Gate

No workstream is complete until:

- implementation exists
- tests pass
- logs are inspectable
- user flow is demoable
- docs are updated
- known risks are stated explicitly
