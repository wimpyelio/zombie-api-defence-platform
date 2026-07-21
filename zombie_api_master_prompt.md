# Master Prompt: Zombie API Discovery & Defence Platform
### Hybrid Architecture Brief — Tier-1 Banking Environment

---

## Context & Constraints (Read Before Designing)

You are the lead architect at a Tier-1 bank. The environment you are solving for has the following non-negotiable realities:

- Legacy SOAP services buried under REST wrappers, now being decomposed into microservices with no complete service map
- API gateways across Apigee, Kong, and AWS API Gateway — none of them the single source of truth
- Monorepos and fragmented GitLab/GitHub repos with inconsistent OpenAPI spec coverage
- IAM roles and service accounts that outlive their owners
- Regulatory obligations under **RBI Cyber Security Framework**, **PCI-DSS v4.0**, and **GDPR**
- Batch processes that settle hundreds of millions of dollars on fixed schedules — a wrong decommission breaks production
- A security team that needs *actionable intelligence*, not dashboards full of noise

You must design a platform that is **technically uncompromising, operationally safe, and regulatorily defensible**. Every design decision must be justified by the constraints above — not by what sounds impressive.

---

## Problem Statement

Design a complete **Zombie API Discovery and Defence Platform** that:

1. Continuously discovers all APIs — documented, undocumented, shadow, and ghost — across the bank's full infrastructure surface
2. Classifies each API by lifecycle state with zero false positives
3. Assesses every API's real-time security posture
4. Generates prioritised, actionable remediation recommendations
5. Executes **operationally safe** decommissioning workflows for confirmed zombie APIs
6. Prevents future zombie proliferation through governance enforcement at the source
7. Produces audit-ready compliance artefacts for regulators

---

## Required Architecture Components

Design each of the following with full technical depth. Do not summarise — specify.

### 1. Multi-Modal Discovery Engine

Fuse **all four** of the following data streams into a unified discovery layer. For each stream, specify the exact tools, protocols, and data fields captured:

- **Traffic telemetry** — VPC Flow Logs, Service Mesh (Istio/Linkerd) sidecars, API Gateway access logs. Identify what is *actually communicating*, not what is *documented as communicating*.
- **Static code lineage** — Git repository parsing (GitHub/GitLab webhooks + SAST). Extract OpenAPI specs, hardcoded `HttpClient` calls, `.env` endpoint declarations, and Spring Boot/Express route annotations.
- **Artefact & deployment inspection** — CI/CD pipeline hooks (Jenkins/GitHub Actions), container registry scanning (JFrog/Nexus), Kubernetes CRD discovery, Terraform state file parsing.
- **Identity correlation** — Map every API call to its IAM role or Active Directory service account. Flag any API still receiving traffic from a deprovisioned identity — these are your highest-priority ghost endpoints.

Specify how these streams are **deduplicated and reconciled** into a single canonical API record. Address the conflict resolution logic when the same endpoint appears differently across streams.

### 2. The API Ontology — Living Digital Twin

Model the bank's entire API ecosystem as a **versioned, queryable knowledge graph**. Define:

- **Core object schema** for an `APIEndpoint` object: URL, method, version, deployment metadata, traffic time-series, sensitivity classification, lifecycle state, security posture score, and owner linkage
- **Relationship graph**: `exposesData → PII/PCI object`, `ownedBy → Team/Person (HRIS/LDAP)`, `deployedOn → Cluster/CloudResource`, `calls / calledBy → other APIEndpoint` (for shadow dependency detection), `documentedIn → OpenAPI spec / Git repo`
- **State Decay Classification Model** using the following four states — define the exact signal combination that triggers each:

| State | Definition | Required Signals |
|---|---|---|
| **Active** | Healthy, owned, maintained | Traffic above threshold + recent commit + assigned owner |
| **Deprecated** | Scheduled for retirement | `Sunset` header or registry tag + declining traffic trend |
| **Orphaned** | Running with no living owner | Traffic exists + LDAP/HRIS owner record is inactive or deleted |
| **Zombie** | The danger zone | Reachable endpoint + zero commits >12 months + no rate limiting + bypasses modern WAF + legacy auth |

### 3. ML-Augmented Intelligence Layer

Go beyond rule-based classification. Specify the following ML capabilities with model architecture details:

- **Predictive decay forecasting**: Use time-series models (specify: Prophet, LSTM, or hybrid) on API traffic patterns to forecast which *Active* APIs will become Zombies within a configurable window (default: 45 days). Output a confidence score per prediction.
- **Call-graph shadow detection**: Apply graph ML (specify: GraphSAGE or equivalent) on the `calls/calledBy` relationship graph to surface APIs that are reachable but have no registered gateway route and fewer than 2 inbound/outbound relationships — these are your shadow APIs.
- **LLM-augmented code analysis**: Use an LLM pass over code repositories to extract undocumented endpoints from inline comments, handler functions, and configuration files that static regex cannot catch. Specify the prompt pattern and output schema.
- **NLP payload scanning**: Classify API payloads for PII/PCI sensitivity (field names, patterns, entropy signals) to populate the `sensitivityLevel` property on each endpoint object.

### 4. Real-Time Security Posture Scoring

Calculate a **Risk Index (RI)** for every endpoint, updated continuously. Use the following formula as a base and extend it:

$$RI = (S \times E) + \frac{V}{A}$$

Where:
- **S** = Sensitivity score (PII/PCI exposure, determined by NLP payload scanning — range 0–1)
- **E** = Exposure level (1.0 = internet-facing, 0.6 = DMZ, 0.2 = internal-only)
- **V** = Vulnerability composite (missing OAuth/JWT, weak/no mTLS, absent rate limiting, TLS <1.2, exposed API key in repo — each adds a weighted increment)
- **A** = Maintenance age in months since last code review or deployment update

Specify:
- The exact weighting schema for V's sub-components
- The threshold bands: what RI score triggers `Low / Medium / High / Critical`
- How RI is recalculated in real-time vs. batch
- How a Critical-scored Zombie with PCI data exposure triggers an automatic response (not just an alert)

### 5. Operationally Safe Decommissioning — The "Deep-Freeze" Workflow

You **cannot kill a Zombie API without first proving nothing depends on it**. Design a **Graduated Decommissioning Pipeline** with these exact stages:

1. **Alert**: Auto-generate a Jira/ServiceNow ticket to the last known owning business unit. Include: endpoint details, traffic history, dependency graph, RI score, and a deadline for response.
2. **Shadow mode**: Mirror 100% of live traffic to a sandbox environment. Run for a configurable observation window (default: 14 days). Log every caller identity, payload schema, and response code.
3. **Brownout**: Introduce controlled degradation — begin with 5% of requests receiving `429 Too Many Requests`. Escalate to 20%, then 50% over a configurable schedule. This smokes out hidden batch processes and undocumented consumers without breaking production.
4. **Tombstone**: Replace the endpoint with a dedicated response service that returns a structured `410 Gone` payload logging the caller's service identity, timestamp, and request signature for final manual outreach.
5. **Deregister**: Remove the gateway route, scale the deployment to 0, update DNS and firewall rules, run a DAST verification probe (endpoint must return 404 from all network zones), update the ontology, and generate a cryptographically signed **API Obituary Report**.

Specify the rollback mechanism at each stage. No stage is irreversible without an explicit human sign-off.

### 6. Governance as Code — Anti-Proliferation Engine

Prevention is the real long-term win. Specify each of the following enforcement mechanisms:

- **CI/CD Admission Gate**: A pre-merge webhook that blocks any pull request introducing a new API endpoint unless a valid `api-manifest.yaml` is present and the endpoint is registered in the ontology. Define the required fields in `api-manifest.yaml`.
- **K8s Admission Controller**: A validating webhook that prevents any service from being deployed to the cluster without a linked, active ontology record. Specify the controller logic and rejection response.
- **Contract Drift Detection**: Continuous comparison of live traffic schemas against the registered OpenAPI contract. If a new field matching PII patterns (e.g., `ssn`, `card_number`, `dob`) appears in a response payload that wasn't in the original spec, automatically trigger a Circuit Breaker to mask the field and raise a P1 ticket.
- **Weekly API Health Sweep**: Automated scan that re-evaluates every endpoint's RI, updates state classifications, and generates a predictive list of endpoints projected to reach Zombie state within the next 30 days.

### 7. Compliance & Audit Output

The platform must be a **self-generating compliance engine**. Specify the artefacts produced for each of the following:

- **RBI Cyber Security Framework**: Map platform outputs to specific RBI controls. Which controls are automatically evidenced by the platform's continuous monitoring?
- **PCI-DSS v4.0**: Identify all Requirement 6 (secure development) and Requirement 8 (identity management) controls addressable by the platform.
- **GDPR Article 32**: How does the platform evidence appropriate technical measures for APIs handling personal data?
- **API Obituary Report**: A quarterly PDF artefact (auto-generated) documenting every decommissioned API: its lifecycle, traffic history, dependency graph, RI at decommission, decommission stages and dates, and the approving officer's name.

---

## Implementation Roadmap

Provide a **phased delivery plan** with realistic timelines for a Tier-1 bank. For each phase specify: deliverables, success metrics, and the team composition required.

| Phase | Duration | Focus |
|---|---|---|
| **0 — Foundation** | 2 weeks | Ontology schema design + connector setup |
| **1 — Discovery** | 4–6 weeks | Full API inventory baseline (expect 3–8× more than believed) |
| **2 — Classification & Scoring** | 4 weeks | State classification, RI scoring, initial dashboards |
| **3 — ML & Decommissioning** | 4–8 weeks | Predictive models, brownout workflows, CI/CD gates |
| **4 — Hardening** | Ongoing | Quarterly ontology evolution, compliance report automation |

---

## Output Format Requirements

Your response must include:

1. **Architecture overview** — A description of the full system, written for a CISO audience
2. **Technical specification** — Deep-dive on each component above, written for a Principal Engineer
3. **The RI formula** — Fully specified with weighting schema and threshold bands
4. **The `api-manifest.yaml` schema** — Full field definition
5. **The decommissioning state machine** — Stages, transitions, rollback paths, and human sign-off gates
6. **Compliance mapping table** — Platform capability mapped to specific regulatory controls
7. **Implementation roadmap** — Phased, with team composition and success metrics per phase

---

## Evaluation Criteria

Your response will be assessed on:

- **Operational safety**: Does it respect the "never break a $500M batch process" constraint?
- **Technical precision**: Are tool names, model architectures, and data schemas specified — not gestured at?
- **ML depth**: Is the predictive layer genuinely additive, or decorative?
- **Compliance specificity**: Are regulatory controls named and mapped, not referenced generically?
- **Zero sales language**: No vendor branding, no credential signalling, no hyperbole. Signal only.

---

*This prompt is designed to produce a response that is simultaneously the most technically rigorous, operationally safe, and regulatorily defensible solution to Zombie API proliferation in a Tier-1 banking environment. Every section is mandatory. No section may be summarised in place of being specified.*
