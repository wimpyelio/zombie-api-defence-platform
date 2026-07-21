/**
 * @zad/core - Type Definitions
 * 
 * All domain types for the Zombie API Defence Platform.
 * These are the contracts between packages - no implementation details here.
 */

// ============================================================================
// RAW DATA (from discovery pipelines)
// ============================================================================

export type AuthMechanism = "none" | "basic" | "api_key" | "jwt" | "oauth2" | "mtls";
export type TlsVersion = "1.0" | "1.1" | "1.2" | "1.3";
export type GatewayType = "apigee" | "kong" | "aws_apigw" | "internal" | "none";
export type TrafficTrend = "growing" | "stable" | "declining" | "stale" | "dead";
export type LifecycleState = "active" | "deprecated" | "orphaned" | "zombie";
export type RIBand = "Critical" | "High" | "Medium" | "Low";
export type RIBandName = RIBand;

export interface EndpointRaw {
  id: number;
  method: string;
  path: string;
  service: string;
  
  // Sensitivity & Exposure
  s: number;           // Sensitivity [0-1]: PII/PCI payload classification
  e: number;           // Exposure [0-1]: 1.0=internet, 0.6=DMZ, 0.2=internal
  
  // Age & Maintenance
  a: number;           // Age in months since last commit/deploy
  
  // Security Controls
  pci: boolean;
  auth: AuthMechanism;
  tls: TlsVersion;
  rateLimited: boolean;
  wafCoverage: boolean;
  mtls: boolean;
  apiKeyExposed: boolean;
  egressVal: boolean;
  
  // Ownership & Traffic
  owner: string;
  ownerActive: boolean;
  sunsetHeader: boolean;
  trafficTrend: TrafficTrend;
  trafficP90: number;
  lastTraffic: string;
  lastCommit: string;
  decayProb: number;
  
  // Deployment
  gateway: GatewayType;
  deployedOn: string;
  calledBy: number[];
  calls: number[];
}

// ============================================================================
// VULNERABILITY WEIGHTS (configuration)
// ============================================================================

export interface VulnWeights {
  noAuth: number;
  noMTLS: number;
  noRate: number;
  weakTLS: number;
  expKey: number;
  noWAF: number;
  noEgress: number;
}

export const DEFAULT_VULN_WEIGHTS: VulnWeights = {
  noAuth: 0.35,
  noMTLS: 0.25,
  noRate: 0.20,
  weakTLS: 0.15,
  expKey: 0.40,
  noWAF: 0.30,
  noEgress: 0.10,
};

// Export the type as VulnerabilityWeights for backwards compatibility
export type VulnerabilityWeights = VulnWeights;

// ============================================================================
// COMPUTED FIELDS (derived from raw)
// ============================================================================

export interface EndpointComputed {
  v: number;                    // Vulnerability composite
  ri: number;                   // Risk Index
  state: LifecycleState;        // Derived lifecycle state
  predictedZombieDate: string | null; // ISO 8601 date or null
}

export type Endpoint = EndpointRaw & EndpointComputed;

// ============================================================================
// RISK INDEX
// ============================================================================

export interface RIBreakdown {
  endpoint: Endpoint;
  seProduct: number;    // S × E
  v: number;            // Vulnerability composite
  a: number;            // Age (months)
  vOverA: number;       // V / A
  ri: number;           // Final RI
  band: RIBand;
  riBand: RIBandName;  // Alias for band
  autoResponse: boolean; // Zombie + PCI + RI > 0.8
  p0Escalation: boolean; // RI > 2.5
}

// ============================================================================
// DECOMMISSION STATE MACHINE
// ============================================================================

export const DAY_MS = 86_400_000;

export interface DecomHistoryEntry {
  offset: number;    // ms from initiatedAt
  action: string;
  stage: number;     // stage when this occurred
}

export interface DecomState {
  stage: number;                 // 0-4 (Alert, Shadow, Brownout, Tombstone, Deregister)
  initiatedAt: number;           // epoch ms
  history: DecomHistoryEntry[];
}

export interface StageConfig {
  name: string;
  icon: string;
  signoff: string;
  desc: string;
  rollback: string;
}

export const STAGES: ReadonlyArray<StageConfig> = [
  {
    name: "Alert",
    icon: "🚨",
    signoff: "BU Head acknowledgement",
    desc: "Auto-generate ServiceNow INC to last known owning BU. Include endpoint, gateway, RI score, 90-day traffic chart, dependency graph, PCI/PII flags, deprovisioned owner. Hard 14-calendar-day response deadline. If no response: escalate to CTO and CISO.",
    rollback: "Close ticket, mark endpoint \"Under Review\", halt pipeline. Zero production impact.",
  },
  {
    name: "Shadow",
    icon: "👁️",
    signoff: "Security Architect sign-off",
    desc: "Deploy Istio VirtualService mirror (or Kong request-transformer). Route 100% of live traffic to sandbox namespace. 14-day observation window. Log: caller SPIFFE ID / JWT sub, payload schema hash, response codes, latency. Build caller inventory.",
    rollback: "Remove VirtualService mirror rule. Effective in <5s. Zero production impact.",
  },
  {
    name: "Brownout",
    icon: "⚡",
    signoff: "Ops Lead + CISO sign-off",
    desc: "Inject 429 Too Many Requests via gateway rate-limit policy. Day 1–3: 5%, Day 4–7: 20%, Day 8–14: 50%. Each rejection logs blocked caller SPIFFE ID. Configurable exception list for explicitly approved callers.",
    rollback: "Remove rate-limit policy from gateway. Effective in <30s.",
  },
  {
    name: "Tombstone",
    icon: "🪦",
    signoff: "CISO sign-off",
    desc: "Replace gateway route with tombstone service returning HTTP 410 Gone: {status, endpoint, decommission_date, contact, ticket}. Log every caller: SPIFFE ID, timestamp, request signature. Maintain 21 days.",
    rollback: "Restore original gateway route from CI/CD backup manifest.",
  },
  {
    name: "Deregister",
    icon: "💀",
    signoff: "CISO + VP Engineering — dual sign-off required",
    desc: "Remove gateway route, scale K8s deployment to 0, remove DNS A-record, update firewall rules. Run DAST probe from all network zones (must return 404). Update ontology to DECOMMISSIONED. Generate cryptographically signed API Obituary Report.",
    rollback: "IRREVERSIBLE. Explicit dual sign-off before this stage. No automated rollback.",
  },
];

// ============================================================================
// COMPLIANCE
// ============================================================================

export type ComplianceStatus = "auto" | "partial" | "manual";

export interface ComplianceMapping {
  regulation: string;
  control: string;
  capability: string;
  artefact: string;
  status: ComplianceStatus;
}

// ============================================================================
// KNOWLEDGE GRAPH
// ============================================================================

export type NodeType = "api" | "team" | "pci";

export interface KGNode {
  id: string | number;
  type: NodeType;
  x: number;
  y: number;
  state?: LifecycleState | "team" | "pci";
  label: string;
  r?: number;
  critical?: boolean;
}

export type EdgeType = "calls" | "pci" | "owns";

export interface KGEdge {
  s: string | number;
  t: string | number;
  type: EdgeType;
}

export const STATE_COLORS: Record<LifecycleState | "team" | "pci", string> = {
  zombie: "#ff1744",
  orphaned: "#e55a00",
  deprecated: "#f5a623",
  active: "#00e5a0",
  team: "#7b5ea7",
  pci: "#1a3a1a",
};

// ============================================================================
// ML INTELLIGENCE
// ============================================================================

export interface MLModel {
  id: string;
  name: string;
  architecture: string;
  description: string;
  metric: string;
  metricValue: number;
  color: string;
}

export interface DecayForecast {
  endpointId: number;
  decayProb: number;
  predictedZombieDate: string | null;
}

// ============================================================================
// API CONTRACTS (for OpenAPI generation)
// ============================================================================

export interface ApiEndpointListQuery {
  state?: LifecycleState[];
  search?: string;
  minRI?: number;
  maxRI?: number;
  pciOnly?: boolean;
}

export interface ApiEndpointResponse {
  endpoints: Endpoint[];
  total: number;
}

export interface ApiRIBreakdownResponse {
  breakdown: RIBreakdown[];
}

export interface ApiDecommissionState {
  [epId: number]: DecomState;
}

export interface ApiDecommissionAction {
  epId: number;
  action: "advance" | "rollback";
}

export interface ApiDecommissionActionResponse {
  success: boolean;
  newState?: DecomState;
  error?: string;
}