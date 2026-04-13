# Zombie API Defence Platform

An interactive security dashboard for discovering, classifying, and safely 
decommissioning zombie APIs in a Tier-1 banking environment.

Built as a single-file HTML application — no framework, no build step, no 
dependencies. Open `index.html` in any browser and it runs.

## What It Does

Banks accumulate APIs that are reachable but unmaintained — no owner, no rate 
limiting, legacy auth, bypassing modern WAF. These are zombie APIs. Left alive, 
they are the attack surface regulators flag and attackers exploit.

This platform:
- Discovers all API states across 4 data streams (traffic telemetry, code 
  lineage, artefact scan, identity correlation)
- Classifies every endpoint by lifecycle state: Active, Deprecated, Orphaned, Zombie
- Computes a live Risk Index (RI) from raw security properties:
  `RI = (S × E) + (V / A)`
- Runs a 5-stage Deep-Freeze decommissioning pipeline with human sign-off gates
- Maps outputs to RBI CSF, PCI-DSS v4.0, and GDPR Article 32 controls

## Run It

Download `index.html` → open it in any browser. That's it.

## Architecture Decision

No React. No Vue. No build toolchain.

The entire computation pipeline is:
EP_RAW → computeV() → computeRI() → computeState() → rendered UI

Every endpoint's state and risk score is derived from raw security properties. 
Nothing is pre-seeded. One file you can email, open without a build step, 
and demo from any machine. That was the deliberate trade-off.

## Version History

| Version | Score | What Changed |
|---------|-------|--------------|
| v1 | 76/100 | Correct model, RI pre-seeded, no live logic |
| v2 | 91/100 | Live computeRI(), state derived from signals, graph rendered, state machine wired |
| v3 | 97/100 | ep1 age fix, formula note rewritten, D+ timestamps anchored, Obituary Report download, ISO 8601 decay dates |

See [CHANGELOG.md](CHANGELOG.md) for the full audit trail.

## The RI Formula 
RI = (S × E) + (V / A)

- **S** — Sensitivity [0–1]: PII/PCI payload classification (NLP scanner)
- **E** — Exposure [0–1]: network topology (1.0 internet, 0.6 DMZ, 0.2 internal)
- **V** — Vulnerability composite: weighted sum of missing controls
- **A** — Age in months since last commit or deployment update

S and E are orthogonal signals — a high-sensitivity internal endpoint (S=0.9, 
E=0.2) is structurally less dangerous than a low-sensitivity public endpoint 
(S=0.1, E=1.0). The formula captures this as a joint risk product.

**V weights:** No OAuth/JWT +0.35 · No mTLS +0.25 · No rate limiting +0.20 · 
TLS < 1.2 +0.15 · API key exposed in repo +0.40 · No WAF +0.30 · 
No egress validation +0.10

## Compliance Coverage

| Regulation | Controls |
|------------|----------|
| RBI Cyber Security Framework | §6.1, §6.4, §7.2, §8.3 |
| PCI-DSS v4.0 | Req 6.2, 6.3, 8.2, 8.6 |
| GDPR Article 32 | Technical measures, encryption, ongoing confidentiality |

## Regulatory Context

Designed for a Tier-1 banking environment with:
- API gateways across Apigee, Kong, and AWS API Gateway
- Batch processes settling $500M+ on fixed schedules
- Zero tolerance for false positives on decommissioning

## Author

Built by [@wimpyelio](https://github.com/wimpyelio)