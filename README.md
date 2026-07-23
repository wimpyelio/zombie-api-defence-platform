# ZAD Platform — Zombie API Defence

> **Monorepo** for discovering, classifying, and safely decommissioning zombie APIs in regulated environments (banking, fintech, healthcare).

## Overview

Banks accumulate APIs that are reachable but unmaintained — no owner, no rate limiting, legacy auth, bypassing modern WAF. These **zombie APIs** are the attack surface regulators flag and attackers exploit.

ZAD Platform provides:
- **Discovery** — 4 data streams (traffic telemetry, code lineage, artifact scan, identity correlation)
- **Classification** — Lifecycle state machine: `Active → Deprecated → Orphaned → Zombie → Decommissioned`
- **Risk Index (RI)** — Live computation: `RI = (S × E) × (V / A)`
  - `S` — Sensitivity [0-1] (PII/PCI payload classification)
  - `E` — Exposure [0-1] (network topology: internet=1.0, DMZ=0.6, internal=0.2)
  - `V` — Vulnerability composite (weighted missing controls)
  - `A` — Age in months since last commit/deployment
- **Decommission Pipeline** — 5-stage Deep Freeze with human sign-off gates
- **Compliance Mapping** — RBI CSF, PCI-DSS v4.0, GDPR Art. 32

## Architecture

```
zad-platform/
├── packages/
│   ├── core/          # Pure domain logic (TypeScript, zero deps except zod)
│   │   ├── scoring.ts       # RI computation, bands, zombie prediction
│   │   ├── vulnerability.ts # V composite calculation
│   │   ├── decommission.ts  # 5-stage state machine, obituary reports
│   │   ├── compliance.ts    # RBI/PCI/GDPR mappings
│   │   ├── knowledge-graph.ts # SVG-based relationship visualization
│   │   ├── ml-intelligence.ts # Decay forecast, at-risk detection
│   │   └── *.test.ts        # 38 tests, 80%+ coverage
│   ├── api/           # Backend API (planned: Fastify + Zod + OpenAPI)
│   ├── frontend/      # Web UI (Vite + TypeScript, planned: React + TanStack Query)
│   └── shared/        # Shared types (planned)
├── fixtures/          # Test data (endpoint catalogs)
├── docs/              # Architecture, design, runbooks
└── .github/           # CI/CD, templates, governance
```

## Quick Start

```bash
# Prerequisites
node >= 20
pnpm >= 9

# Install
pnpm install

# Test all packages
pnpm test

# Lint
pnpm lint

# Type check
pnpm typecheck

# Build all packages
pnpm build

# Development (frontend)
pnpm dev
```

## Core Package Usage

```bash
cd packages/core
pnpm test        # 38 tests
pnpm lint        # 0 errors
pnpm typecheck   # strict mode
```

```typescript
import { computeRI, computeRIBreakdown, computeState, computeV } from "@zad/core";

const endpoint = {
  id: "api/v1/payments",
  s: 0.9,      // High sensitivity (PCI)
  e: 1.0,      // Internet exposed
  v: 0.85,     // Missing OAuth, rate limiting, WAF
  a: 6,        // 6 months since last deploy
  pci: true,
  trafficTrend: "declining",
  ownerActive: false
};

const ri = computeRI(endpoint);           // 12.75
const breakdown = computeRIBreakdown(endpoint);
const state = computeState(endpoint);     // "zombie"
```

## Risk Index Formula

```
RI = (S × E) × (V / A)
```

| Factor | Range | Description |
|--------|-------|-------------|
| **S** (Sensitivity) | 0–1 | Data classification via NLP scanner |
| **E** (Exposure) | 0–1 | Network topology (1.0=internet, 0.6=DMZ, 0.2=internal) |
| **V** (Vulnerability) | 0–1+ | Weighted sum of missing security controls |
| **A** (Age) | ≥0.1 months | Time since last commit/deployment |

**RI Bands:** `Critical ≥ 2.5` · `High ≥ 1.0` · `Medium ≥ 0.4` · `Low < 0.4`

**V Weights:** No OAuth/JWT +0.35 · No mTLS +0.25 · No Rate Limiting +0.20 · TLS<1.2 +0.15 · API Key in Repo +0.40 · No WAF +0.30 · No Egress Validation +0.10

## Decommission State Machine

```
Active → Deprecated → Orphaned → Zombie → Decommissioned
   ↑         ↑            ↑          ↑
   |         |            |          └─ Gate 5: Final sign-off (Security + Ops + Owner)
   |         |            └─ Gate 4: Freeze traffic, capture evidence
   |         └─ Gate 3: Owner confirmation, migration plan
   └─ Gate 1/2: Sunset header, traffic monitoring
```

Each stage requires explicit sign-off with audit trail.

## Compliance Coverage

| Regulation | Controls |
|------------|----------|
| **RBI Cyber Security Framework** | §6.1, §6.4, §7.2, §8.3 |
| **PCI-DSS v4.0** | Req 6.2, 6.3, 8.2, 8.6 |
| **GDPR Article 32** | Technical measures, encryption, ongoing confidentiality |

## Development

### Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add GDPR Art. 32 mapping for encryption
fix(frontend): resolve hydration mismatch on dashboard
docs: update RI formula in README
test(core): add zombie prediction edge cases
refactor(scoring): extract V calculation to vulnerability.ts
chore: update dependencies
```

### Pull Request Requirements

- [ ] All CI checks pass (lint, typecheck, test, build)
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] Conventional commit messages
- [ ] No console.log/debugger in production code

### Adding Dependencies

```bash
# Runtime dependency (core, api, frontend)
pnpm add <pkg> --filter=@zad/core

# Dev dependency
pnpm add -D <pkg> --filter=@zad/core

# Workspace-wide dev dependency
pnpm add -D -w <pkg>
```

## Governance

| Document | Purpose |
|----------|---------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development workflow, standards |
| [SECURITY.md](SECURITY.md) | Vulnerability disclosure, supported versions |
| [CODEOWNERS](.github/CODEOWNERS) | Required reviewers by path |
| [LICENSE](LICENSE) | MIT License |

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):
1. **Lint** — ESLint + Prettier
2. **Typecheck** — TypeScript strict mode
3. **Test** — Vitest with coverage thresholds
4. **Build** — All packages compile

## Roadmap

- [ ] `@zad/api` — Fastify backend with Zod validation, JWT auth, OpenAPI
- [ ] `@zad/frontend` — React + TanStack Query dashboard
- [ ] `@zad/shared` — Shared types package
- [ ] Changesets for automated versioning
- [ ] Dependabot / Renovate for dependency updates
- [ ] E2E tests (Playwright)
- [ ] Deployment pipeline (staging → production)

## License

MIT — see [LICENSE](LICENSE)

---

*Built for regulated environments where zombie APIs aren't just technical debt — they're regulatory risk.*