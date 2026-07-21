/**
 * @zad/core - Type Definitions
 *
 * All domain types for the Zombie API Defence Platform.
 * These are the contracts between packages - no implementation details here.
 */
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
    s: number;
    e: number;
    a: number;
    pci: boolean;
    auth: AuthMechanism;
    tls: TlsVersion;
    rateLimited: boolean;
    wafCoverage: boolean;
    mtls: boolean;
    apiKeyExposed: boolean;
    egressVal: boolean;
    owner: string;
    ownerActive: boolean;
    sunsetHeader: boolean;
    trafficTrend: TrafficTrend;
    trafficP90: number;
    lastTraffic: string;
    lastCommit: string;
    decayProb: number;
    gateway: GatewayType;
    deployedOn: string;
    calledBy: number[];
    calls: number[];
}
export interface VulnWeights {
    noAuth: number;
    noMTLS: number;
    noRate: number;
    weakTLS: number;
    expKey: number;
    noWAF: number;
    noEgress: number;
}
export declare const DEFAULT_VULN_WEIGHTS: VulnWeights;
export type VulnerabilityWeights = VulnWeights;
export interface EndpointComputed {
    v: number;
    ri: number;
    state: LifecycleState;
    predictedZombieDate: string | null;
}
export type Endpoint = EndpointRaw & EndpointComputed;
export interface RIBreakdown {
    endpoint: Endpoint;
    seProduct: number;
    v: number;
    a: number;
    vOverA: number;
    ri: number;
    band: RIBand;
    riBand: RIBandName;
    autoResponse: boolean;
    p0Escalation: boolean;
}
export declare const DAY_MS = 86400000;
export interface DecomHistoryEntry {
    offset: number;
    action: string;
    stage: number;
}
export interface DecomState {
    stage: number;
    initiatedAt: number;
    history: DecomHistoryEntry[];
}
export interface StageConfig {
    name: string;
    icon: string;
    signoff: string;
    desc: string;
    rollback: string;
}
export declare const STAGES: ReadonlyArray<StageConfig>;
export type ComplianceStatus = "auto" | "partial" | "manual";
export interface ComplianceMapping {
    regulation: string;
    control: string;
    capability: string;
    artefact: string;
    status: ComplianceStatus;
}
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
export declare const STATE_COLORS: Record<LifecycleState | "team" | "pci", string>;
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
//# sourceMappingURL=types.d.ts.map