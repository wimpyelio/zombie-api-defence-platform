# Changelog

Evaluated against: Zombie API Discovery & Defence Platform — Tier-1 banking 
environment, RBI CSF + PCI-DSS v4.0 + GDPR constraints.

---

## v3 — 97/100

**P0: ep1 age corrected (a:5 → 13)**  
With `a:5`, `/api/v1/legacy/payment/refund` classified as `orphaned` not `zombie` 
— a silent contradiction between the decommission pipeline and the inventory table.  
Fix: `a:13` so `computeState()` correctly returns `zombie`  
(a≥12 AND !rateLimited AND !wafCoverage AND auth='none').

**P0: Formula note rewritten — S/E orthogonality**  
v2 note said "internet-facing S=0.9" — conflating S (payload sensitivity) with  
E (network exposure). These are orthogonal signals. Note now defines both  
variables precisely and explains the joint risk product.

**P0: D+ timestamps anchored to `initiatedAt`**  
v2 computed D+ relative to a hardcoded November 2023 epoch, rendering as D+850.  
Each `decomState` entry now stores `initiatedAt` as a ms timestamp at creation.  
History entries store `offset` in ms from that anchor.

**P2: API Obituary Report download**  
At Stage 5, a download button generates a complete plain-text report:  
RI decomposition, security posture, pipeline log with correct D+ timestamps,  
approving officer fields, DAST confirmation, compliance cross-references.  
Implemented via `Blob` + `URL.createObjectURL` + `revokeObjectURL`.

**P2: `predicted_zombie_date` as ISO 8601**  
`predictedZombieDate(ep)` computes months until a≥12, weights by `decayProb`,  
returns `new Date().toISOString().split('T')[0]`.  
Visible in inventory table, endpoint drawer, and ML decay list.

---

## v2 — 91/100

**P0: `computeRI()` is now a live function**  
v1 had RI pre-seeded. v2 introduced `EP_RAW` with raw security properties.  
`computeV(ep)` sums weighted sub-components. `computeRI(ep) = (s×e) + (v/a)`  
is a pure function called at runtime. Nothing pre-seeded.

**P0: State derived from security signals, not the reverse**  
v1 set TLS/auth display values based on `state === 'zombie'` — backwards.  
v2: `computeState(ep)` evaluates raw properties to produce state.  
Security signals → state. State never → security signals.

**P0: Knowledge graph rendered**  
v1 had a CSS rule, no render. v2: full SVG graph, 16 API nodes sized by  
traffic volume, 3 team nodes, 1 PCI data object, colour-coded edges,  
zombie glow filter, click-to-highlight adjacency.

**P0: Decommission state machine wired**  
Sign-off gate checkbox gates the Advance button. `advanceStage()` moves  
endpoints through pipeline with timestamped history. `rollbackStage()` reverts  
one stage with a log entry. Three in-flight decommissions pre-populated.

---

## v1 — 76/100

Correct conceptual model. Every tab maps to the master prompt.  
`api-manifest.yaml` and LLM extraction schema production-ready.

**Failures:**  
- RI pre-seeded, `computeRI()` not live  
- TLS/auth derived from state (backwards)  
- Knowledge graph: CSS present, render absent  
- Decommission pipeline: UI only, no state machine