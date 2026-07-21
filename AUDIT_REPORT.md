# ZAD (Zombie API Defence Platform) — Frontier Audit Report

**Auditor:** Senior Software Architect / Staff Engineer / Technical Auditor
**Methodology:** Frontier Protocol (best-of-N candidates, fresh-eyes sweeps, taste gate, convergence)
**Craft Standards Applied:** `code.md`, `security.md`, `ops.md`, `design.md`, `data.md`, `product.md`, `decisions.md`
**Date:** 2025-07-21

---

## EXECUTIVE SUMMARY

**Verdict:** **Portfolio-grade prototype — NOT production-ready.** The project demonstrates strong conceptual modeling, impressive domain expertise in banking API security, and clean vanilla JS implementation of complex visualizations. However, it lacks every production-grade attribute: no backend, no auth, no persistence, no tests, no CI/CD, no observability, no deployment model, and fundamental architectural limitations that prevent horizontal scaling.

**Scores:**

| Dimension | Score | Verdict |
|-----------|-------|---------|
| Architecture | 2/10 | Single-file SPA, no backend, no API layer, hardcoded data |
| Code Quality | 4/10 | Clean vanilla JS but no types, no modules, no testability, massive inline HTML/JS/CSS |
| Scalability | 1/10 | Cannot scale beyond 1 browser tab; no server, no DB, no cache |
| Security | 2/10 | No authN/authZ, no input validation, secrets would be in client bundle, no CSP |
| Performance | 3/10 | 93KB single HTML; all compute in main thread; no code splitting |
| Maintainability | 2/10 | 1,252 lines in one file; no separation of concerns; no linting/types |
| DevOps | 1/10 | No build, no CI, no deploy, no monitoring, no rollback |
| Documentation | 6/10 | Excellent README/CHANGELOG for a demo; zero API docs, runbooks, ADRs |

**Overall: 2.6/10 — Portfolio Demo, Not Production System**

---

## FRESH-EYES SWEEP FINDINGS

### SWEEP 1: ARCHITECTURE & DESIGN (per `code.md` §1, `product.md`, `decisions.md`)

| # | Finding | Location | Severity | Evidence |
|---|---------|----------|----------|----------|
| A1 | **No backend exists** — entire "platform" is a static HTML file with hardcoded mock data (`EP_RAW` array) | `index.html:459-523` | **CRITICAL** | 16 endpoints hardcoded; `computeRI()`, `computeState()` run in browser only |
| A2 | **No API layer** — no REST/GraphQL/gRPC contracts; frontend *is* the backend | Entire codebase | **CRITICAL** | Violates `code.md` §3: "Explicit contract first: request and response schemas written down before code" |
| A3 | **Single-point-of-failure architecture** — no redundancy, no horizontal scaling, no stateless services | N/A (missing) | **CRITICAL** | Violates `ops.md` §1: "Deploy small and often"; no deployable units exist |
| A4 | **Data model baked into UI** — `EP_RAW` contains computed fields (`s`, `e`, `a`, `pci`, `auth`, `tls`...) that should come from discovery pipelines | `index.html:459-523` | **HIGH** | Violates `code.md` §1: "Root cause over symptom"; `code.md` §2: "Validate at system boundaries" |
| A5 | **No multi-tenancy model** — single bank context hardcoded; `security.md` §1.15-20 requires tenant-scoped queries | N/A | **HIGH** | Master prompt explicitly mentions "Tier-1 banking environment" with multi-gateway |
| A6 | **No event-driven architecture** — discovery feeds simulated via `setInterval` | `index.html:1200-1211` | **HIGH** | Master prompt §40 requires "Traffic telemetry — VPC Flow Logs, Service Mesh sidecars" |
| A7 | **Knowledge graph is static SVG** — not queryable, not versioned, not backed by a graph DB | `index.html:1001-1080` | **MEDIUM** | Master prompt §51-56 requires "versioned, queryable knowledge graph" |

**Architecture Assessment:** The project implements a **dashboard mockup**, not a platform. The master prompt describes a sophisticated multi-modal discovery engine, ontology, ML layer, and decommissioning pipeline — **none of which exist as running code**. The HTML file is a *visualization* of what the platform *should* produce.

---

### SWEEP 2: CODE QUALITY & IMPLEMENTATION (per `code.md` §1-§7)

| # | Finding | Location | Severity | Evidence |
|---|---------|----------|----------|----------|
| C1 | **No TypeScript / no types** — all data shapes implicit; `computeV(ep)` accesses `ep.auth`, `ep.mtls`, etc. with no contracts | `index.html:526-548` | **CRITICAL** | Violates `code.md` §2: "Types strict; no `any` escape hatches; typecheck is the cheap gate" |
| C2 | **Single 1,252-line file** — HTML, CSS, JS, data, all inline; no modules, no separation of concerns | Entire file | **CRITICAL** | Violates `code.md` §1: "Smallest correct change"; `design.md` §1: "One system per deliverable" |
| C3 | **Zero tests** — no unit, integration, or E2E tests; `code.md` §4 requires "Unit tests on the changed behavior" as gate 2 | N/A | **CRITICAL** | No test infrastructure whatsoever |
| C4 | **No linting, no formatting, no pre-commit** — raw JS with `var`/`let`/`const` mixed, inconsistent semicolons | Throughout | **HIGH** | Violates `code.md` §4 gate 1: "Typecheck / lint (seconds; run constantly)" |
| C5 | **Magic numbers everywhere** — `V_W` weights, RI thresholds, decay formulas hardcoded with no config | `index.html:456, 526-548, 243-246` | **HIGH** | Violates `code.md` §6: "Specific-sounding is not specific. A number only counts if it maps to something checkable" |
| C6 | **Business logic in render functions** — `renderMainTable()` computes checkmarks, filters, formatting inline | `index.html:708-737` | **HIGH** | Violates `code.md` §1: "Read before write — identify existing patterns" |
| C7 | **State mutation scattered** — `endpoints` array mutated by `setInterval` (RI micro-drift) | `index.html:1214-1217` | **MEDIUM** | Violates `code.md` §2: "Concurrency is designed: check-then-act across an await is a race" |
| C8 | **No error boundaries / error handling** — any JS error crashes entire dashboard | N/A | **MEDIUM** | Violates `code.md` §2: "Error paths are designed, not swallowed" |
| C9 | **No structured logging** — no logging at all; `code.md` §4 gate 3: "Log enough to debug a 3am failure" | N/A | **LOW** | |
| C10 | **Copy-pasted render patterns** — `renderStatCards`, `renderDonut`, `renderRIHist` all duplicate SVG construction logic | `index.html:637-754` | **LOW** | Violates `code.md` §6: "Copy-pasted blocks with one variable changed → extract only if 2+ real call sites" |

**Code Quality Assessment:** The vanilla JS is *clean for a demo* — pure functions for `computeV`, `computeRI`, `computeState` are well-structured. But the absence of TypeScript, modules, tests, and any build pipeline makes this **unmaintainable at scale**.

---

### SWEEP 3: SECURITY & COMPLIANCE (per `security.md` §1-§8)

| # | Finding | Location | Severity | Evidence |
|---|---------|----------|----------|----------|
| S1 | **Zero authentication / authorization** — anyone opening `index.html` sees all bank API data, PCI endpoints, decommissioning controls | Entire app | **CRITICAL** | Violates `security.md` §1.8: "Every route states its required identity and role. Deny by default" |
| S2 | **No input validation** — `ep-search` input directly filters `endpoints` array with `.includes()` — XSS vector if data were user-controlled | `index.html:709-712` | **CRITICAL** | Violates `security.md` §2.35: "Validate at the boundary with schemas that reject unknown fields" |
| S3 | **Secrets would be in client bundle** — any real API keys, gateway creds, DB passwords would ship to browser | Architecture | **CRITICAL** | Violates `security.md` §3.56: "Secrets live in env or a vault, never in code, git history, logs, error messages, or client bundles" |
| S4 | **No CSP, no security headers** — static file serves with no protections | N/A | **HIGH** | Violates `security.md` §7: "Disabling TLS verification, wildcard CORS with credentials, permissive CSP 'temporarily'" |
| S5 | **No audit logging** — decommissioning actions, sign-offs, RI recalculations leave no trace | `index.html:870-892` | **HIGH** | Master prompt §32: "Produces audit-ready compliance artefacts for regulators"; `security.md` §1.31: "Admin and destructive actions write an audit entry (who, what, when)" |
| S6 | **No rate limiting on any endpoint** — if this had a backend, all endpoints would be open to abuse | N/A | **HIGH** | `security.md` §1.30: "Endpoints that spend money or send messages get per-user and per-tenant caps" |
| S7 | **Object-level authorization missing** — `openDrawer(id)` exposes any endpoint detail by ID with no ownership check | `index.html:1126-1168` | **MEDIUM** | Violates `security.md` §1.12-14: "Object-level checks on every fetch, update, and delete by id (the IDOR classic)" |
| S8 | **No webhook signature verification** — master prompt §49 requires "Verify signatures on EVERY inbound webhook" | N/A | **MEDIUM** | |
| S9 | **LLM boundaries unguarded** — if ML features were wired, model output would be untrusted input per `security.md` §2.52 | N/A | **LOW** | |

**Security Assessment:** **Fundamentally insecure.** This is a client-side visualization with zero server-side enforcement. Any production deployment would require a complete backend rewrite with authZ, validation, audit logging, and secrets management.

---

### SWEEP 4: SCALABILITY, PERFORMANCE & OPS (per `ops.md` §1-§8)

| # | Finding | Location | Severity | Evidence |
|---|---------|----------|----------|----------|
| O1 | **No deployable units** — single static file; `ops.md` §1: "Deploy small and often; one logical change per deploy" | N/A | **CRITICAL** | |
| O2 | **No database, no migrations, no backup strategy** — `ops.md` §2: "Backup immediately before any schema change... rehearse restore quarterly" | N/A | **CRITICAL** | |
| O3 | **No monitoring / observability** — no uptime checks, error tracking, latency signals, correctness signals | N/A | **CRITICAL** | `ops.md` §3: "Minimum per service: uptime check from OUTSIDE, error tracking with source maps, p95 latency, correctness signal" |
| O4 | **No alerting, no on-call, no incident process** — `ops.md` §4: "Stabilize first: rollback beats live debugging" | N/A | **CRITICAL** | |
| O5 | **All compute in browser main thread** — RI calculations, graph rendering, filtering block UI | `index.html:1214-1217` | **HIGH** | `ops.md` §5: "Budgets on real pages: LCP <2.5s, INP <200ms, measured with Lighthouse on throttled connection" |
| O6 | **No caching strategy** — `ops.md` §5: "Cache deliberately: static assets immutable with hashes; HTML and API responses with explicit, chosen TTLs" | N/A | **HIGH** | |
| O7 | **No cost discipline** — `ops.md` §6: "Know top 3 cost drivers... set anomaly alerts on spiky ones (AI keys especially)" | N/A | **MEDIUM** | |
| O8 | **93KB single HTML** — no code splitting, no lazy loading, fonts from Google Fonts (external dependency) | `index.html:1-4` | **MEDIUM** | `ops.md` §5: "JS budget stated per page; third-party scripts audited (each one is someone else's outage)" |
| O9 | **No rollback procedure** — `ops.md` §1.7: "Know the rollback BEFORE shipping: which command or click reverts this, and does it also revert data?" | N/A | **CRITICAL** | |

**Ops Assessment:** **Zero operational maturity.** This cannot be deployed, monitored, debugged, or rolled back in any production sense.

---

### SWEEP 5: MAINTAINABILITY, DEVEX & DOCUMENTATION

| # | Finding | Location | Severity | Evidence |
|---|---------|----------|----------|----------|
| M1 | **No module system** — all code in one `<script>` block; cannot tree-shake, lazy-load, or test in isolation | Entire file | **CRITICAL** | |
| M2 | **No development environment** — no `package.json`, no dev server, no hot reload, no TypeScript config | N/A | **CRITICAL** | |
| M3 | **No contribution guide, no CODEOWNERS, no PR template** — `design.md` §1: "One system per deliverable" | N/A | **HIGH** | |
| M4 | **Excellent README/CHANGELOG for a demo** — clear architecture decision, version history, formula docs | `README.md`, `CHANGELOG.md` | **POSITIVE** | |
| M5 | **Zero API documentation** — no OpenAPI spec, no contract docs, no SDK examples | N/A | **HIGH** | `code.md` §3: "Explicit contract first: request and response schemas written down before code" |
| M6 | **No runbooks, no ADRs, no onboarding docs** — `ops.md` §4: "Short blameless postmortem: timeline, root cause, ONE systemic fix" | N/A | **MEDIUM** | |
| M7 | **Hardcoded demo data in source** — `EP_RAW` array commits fake endpoints, fake owners, fake PCI data | `index.html:459-523` | **MEDIUM** | `design.md` §6.96-97: "Stock photos, fake avatars, stock names (Acme, John Smith)... realistic, internally consistent demo data" |
| M8 | **No accessibility audit** — `design.md` §5.80: "Touch targets 44px min; keyboard reachable; focus order matches visual order" | N/A | **LOW** | |

---

## TASTE GATE: SENIOR ENGINEER ASSESSMENT

**Panel: First-Time Audience | Expert Practitioner | Brand Owner**

| Lens | Verdict | Key Finding |
|------|---------|-------------|
| **First-Time Audience** | ❌ FAIL | "Where is the API? Where do I deploy this? How do I add a new data source?" — The demo answers "what it looks like" but not "how it works" |
| **Expert Practitioner** | ❌ FAIL | "This is a Figma prototype in code. No backend, no tests, no types, no security model. The RI formula and state machine are the only real IP here." |
| **Brand Owner** | ⚠️ CONDITIONAL PASS | "The domain modeling is genuinely senior-level. The compliance mapping (RBI/PCI/GDPR) is accurate. But shipping this as-is would embarrass the brand." |

**DISTILL Rules (per `protocol.md` §4.201):**

1. **RULE:** Never ship a frontend without a backend contract. → Add to `code.md` §3.
2. **RULE:** Demo data must be in a separate fixture file, not in source. → Add to `design.md` §6.
3. **RULE:** Any visualization of a "platform" must have a working API behind it. → Add to `product.md`.

---

## ROADMAP: CURRENT STATE → PRODUCTION-READY (6-8 WEEKS)

### Phase 1: Foundation (Weeks 1-2)
- [ ] Initialize TypeScript monorepo (`npm workspaces` or `turborepo`)
- [ ] Add `package.json`, `tsconfig.json`, `eslint.config.js`, `prettier.config.js`
- [ ] Set up Vitest + React Testing Library (or vanilla JS test harness)
- [ ] Configure GitHub Actions CI: lint → typecheck → test → build
- [ ] Extract `EP_RAW` → `fixtures/endpoints.json` (separate demo data from source)

### Phase 2: Backend API (Weeks 3-4)
- [ ] Design OpenAPI 3.1 spec for: `/endpoints`, `/endpoints/:id`, `/ri/:id`, `/decommission`, `/graph`, `/compliance`
- [ ] Implement Fastify/Express/Hono server with Zod validation
- [ ] Add PostgreSQL + Prisma/Drizzle for persistence
- [ ] Implement JWT auth + RBAC (roles: `viewer`, `analyst`, `ops-lead`, `ciso`)
- [ ] Add audit logging middleware (who, what, when, IP, user-agent)

### Phase 3: Frontend Refactor (Weeks 5-6)
- [ ] Migrate to Vite + React/Preact/Svelte (or keep vanilla with ES modules)
- [ ] Split `index.html` into: `src/data/`, `src/compute/`, `src/ui/`, `src/views/`
- [ ] Add TanStack Query / SWR for server state
- [ ] Implement proper error boundaries, loading states, empty states
- [ ] Add Storybook for component documentation

### Phase 4: Observability & Hardening (Weeks 7-8)
- [ ] Add structured logging (pino) + OpenTelemetry tracing
- [ ] Deploy to staging (Fly.io / Railway / Render free tier)
- [ ] Configure Sentry + uptime checks (UptimeRobot / Better Uptime)
- [ ] Load test with k6 (target: 100 RPS, p95 < 200ms)
- [ ] Penetration test (OWASP ZAP + manual review)
- [ ] Document runbooks: deploy, rollback, incident response, backup/restore

---

## ROADMAP: PRODUCTION-READY → ENTERPRISE-SCALE (6-18 MONTHS)

| Quarter | Focus | Key Deliverables |
|---------|-------|------------------|
| **Q1** | Discovery Pipelines | 4-stream ingestion (VPC Flow Logs, SAST, K8s/Artefacts, IAM); deduplication & reconciliation engine; canonical API ontology in Neo4j/PostgreSQL |
| **Q2** | ML Intelligence Layer | Decay Forecaster (Prophet+LSTM), Shadow API Detector (GraphSAGE), LLM Code Analyst (prompt-chained), PII/PCI Scanner (spaCy+regex+entropy); model registry + A/B testing |
| **Q3** | Deep-Freeze Engine | Durable workflow engine (Temporal/Orkes); 5-stage pipeline with human gates; rollback procedures; cryptographic obituary reports; DAST integration |
| **Q4** | Governance & Compliance | CI/CD admission gate (api-manifest.yaml); K8s admission controller; contract drift detection; automated compliance evidence packs (RBI/PCI/GDPR) |
| **Year 2** | Platform Maturity | Multi-region active-active; plugin SDK for custom scanners; AI-native ops (auto-remediation); open ontology standard; customer-facing portal |

---

## WHAT AN EXPERIENCED SENIOR ENGINEER WOULD SAY

> **"This is a strong *design document* masquerading as an implementation. The RI formula, the 4-state classification, the 5-stage Deep-Freeze pipeline, the compliance mapping — that's the real work. The HTML file is just a very pretty README."**

**What's missing to reach "professionally built":**

| Category | Missing |
|----------|---------|
| **Backend** | API server, database, auth, validation, audit logging |
| **Quality** | TypeScript, tests (unit/integration/E2E), CI/CD, linting |
| **Security** | AuthZ, input validation, secrets management, CSP, rate limiting |
| **Operations** | Deploy pipeline, monitoring, alerting, logging, rollback, runbooks |
| **Architecture** | Service boundaries, event-driven discovery, durable workflows, multi-tenancy |
| **Scale** | Horizontal scaling, caching, query optimization, cost monitoring |

**Bottom Line:** The **intellectual property** here (domain model, risk formula, compliance mapping, ML specs) is genuinely valuable and demonstrates senior-level thinking. The **implementation** is a portfolio demo. **Do not present this as a production platform.** Present it as: *"A conceptual prototype and domain model for a Zombie API Defence Platform, with a production-grade backend architecture designed and a 40-week implementation roadmap."*

---

*Audit conducted per Frontier Protocol v1.1. All findings traceable to craft standards in `~/.hermes/skills/frontier/references/craft/`. Taste gate conducted via three-lens panel per `judges.md` Judge 2. Rules distilled per `protocol.md` §4.201.*