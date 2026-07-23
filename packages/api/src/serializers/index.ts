import type { EndpointRaw, Endpoint, EndpointComputed, DecomState, DecomHistoryEntry, RIBreakdown, StageConfig, AuthMechanism, TlsVersion, GatewayType, TrafficTrend, LifecycleState, RIBand, RIBandName } from "@zad/core";
import { STAGES as CoreSTAGES, computeRIBreakdown, predictedZombieDate, getRIBand } from "@zad/core";

export interface PrismaEndpoint {
  id: string;
  method: string;
  path: string;
  service: string;
  sensitivity: number;
  exposure: number;
  ageMonths: number;
  pci: boolean;
  authMechanism: string;
  tlsVersion: string;
  rateLimited: boolean;
  wafCoverage: boolean;
  mtls: boolean;
  apiKeyExposed: boolean;
  egressValidated: boolean;
  owner: string;
  ownerActive: boolean;
  sunsetHeader: string | null;
  trafficTrend: string;
  trafficP90: number;
  lastTraffic: Date;
  lastCommit: Date;
  decayProb: number;
  gateway: string;
  deployedOn: Date;
  calledBy: string;
  calls: string;
  v: number;
  ri: number;
  riBand: string;
  lifecycleState: string;
  decomState: PrismaDecomState | null;
  createdAt: Date;
}

export interface PrismaDecomState {
  id: string;
  endpointId: string;
  stage: number;
  initiatedAt: Date;
  history: string;
  currentSignoff: string | null;
}

export function toEndpoint(raw: PrismaEndpoint): EndpointRaw {
  return {
    id: parseInt(raw.id.replace(/\D/g, '')) || 0,
    method: raw.method,
    path: raw.path,
    service: raw.service,
    s: raw.sensitivity,
    e: raw.exposure,
    a: raw.ageMonths,
    pci: raw.pci,
    auth: raw.authMechanism as EndpointRaw['auth'],
    tls: raw.tlsVersion as EndpointRaw['tls'],
    rateLimited: raw.rateLimited,
    wafCoverage: raw.wafCoverage,
    mtls: raw.mtls,
    apiKeyExposed: raw.apiKeyExposed,
    egressVal: raw.egressValidated,
    owner: raw.owner,
    ownerActive: raw.ownerActive,
    sunsetHeader: raw.sunsetHeader || '',
    trafficTrend: raw.trafficTrend as EndpointRaw['trafficTrend'],
    trafficP90: raw.trafficP90,
    lastTraffic: raw.lastTraffic.toISOString(),
    lastCommit: raw.lastCommit.toISOString(),
    decayProb: raw.decayProb,
    gateway: raw.gateway as EndpointRaw['gateway'],
    deployedOn: raw.deployedOn.toISOString(),
    calledBy: JSON.parse(raw.calledBy || '[]'),
    calls: JSON.parse(raw.calls || '[]'),
  };
}

export function toEndpointComputed(raw: PrismaEndpoint): EndpointComputed {
  const endpointRaw = toEndpoint(raw);
  const v = raw.v;
  const ri = raw.ri;
  const state = raw.lifecycleState.toLowerCase() as EndpointComputed['state'];
  const pzd = predictedZombieDate(endpointRaw);
  const riBand = getRIBand(ri);
  
  return {
    v,
    ri,
    state,
    predictedZombieDate: pzd,
    riBand,
  };
}

export function toEndpointFull(raw: PrismaEndpoint): Endpoint {
  return {
    ...toEndpoint(raw),
    ...toEndpointComputed(raw),
  };
}

function parseHistory(historyStr: string): DecomHistoryEntry[] {
  try {
    const parsed = JSON.parse(historyStr);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((h: any) => ({
      offset: typeof h.offset === 'number' ? h.offset : 0,
      action: String(h.action || ''),
      stage: typeof h.stage === 'number' ? h.stage : 0,
    }));
  } catch {
    return [];
  }
}

export function toDecomState(raw: PrismaDecomState | null): DecomState | null {
  if (!raw) return null;
  return {
    stage: raw.stage,
    initiatedAt: raw.initiatedAt.getTime(),
    history: parseHistory(raw.history),
  };
}

export function toDecomStateFull(raw: PrismaDecomState | null): {
  stage: number;
  stageName: string;
  icon: string;
  signoff: string;
  desc: string;
  rollback: string;
  initiatedAt: string | null;
  history: DecomHistoryEntry[];
  canAdvance: boolean;
  canRollback: boolean;
  nextStage: number | null;
} | null {
  if (!raw) return null;
  const state = toDecomState(raw);
  if (!state) return null;
  
  const stageConfig = CoreSTAGES[state.stage] || CoreSTAGES[0];
  return {
    stage: state.stage,
    stageName: stageConfig.name,
    icon: stageConfig.icon,
    signoff: stageConfig.signoff,
    desc: stageConfig.desc,
    rollback: stageConfig.rollback,
    initiatedAt: state.initiatedAt ? new Date(state.initiatedAt).toISOString() : null,
    history: state.history,
    canAdvance: state.stage < 4,
    canRollback: state.stage > 0,
    nextStage: state.stage < 4 ? state.stage + 1 : null,
  };
}

export function toDecomStateList(raw: PrismaDecomState | null): {
  stage: number;
  stageName: string;
  initiatedAt: string | null;
  history: DecomHistoryEntry[];
} | null {
  if (!raw) return null;
  const state = toDecomState(raw);
  if (!state) return null;
  
  return {
    stage: state.stage,
    stageName: CoreSTAGES[state.stage]?.name || 'Unknown',
    initiatedAt: state.initiatedAt ? new Date(state.initiatedAt).toISOString() : null,
    history: state.history,
  };
}

export function toRIBreakdown(raw: PrismaEndpoint): RIBreakdown {
  const endpoint = toEndpointFull(raw);
  return computeRIBreakdown({ ...endpoint, pci: raw.pci });
}

export function toVulnBreakdown(raw: PrismaEndpoint) {
  const endpointRaw = toEndpoint(raw);
  return {
    noAuth: endpointRaw.auth === 'none' ? 1 : 0,
    noMTLS: endpointRaw.mtls ? 0 : 1,
    noRate: endpointRaw.rateLimited ? 0 : 1,
    weakTLS: ['1.0', '1.1'].includes(endpointRaw.tls) ? 1 : 0,
    expKey: endpointRaw.apiKeyExposed ? 1 : 0,
    noWAF: endpointRaw.wafCoverage ? 0 : 1,
    noEgress: endpointRaw.egressVal ? 0 : 1,
    total: 0,
  };
}

// Extended endpoint response type that includes all fields expected by API response
export interface ApiEndpointFull {
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
  sunsetHeader: string;
  trafficTrend: TrafficTrend;
  trafficP90: number;
  lastTraffic: string;
  lastCommit: string;
  decayProb: number;
  gateway: GatewayType;
  deployedOn: string;
  v: number;
  ri: number;
  state: LifecycleState;
  predictedZombieDate: string | null;
  riBand: RIBand;
  vulnerabilityBreakdown: ReturnType<typeof toVulnBreakdown>;
  riBreakdown: RIBreakdown;
  calls: Array<{ id: string; method: string; path: string; service: string }>;
  calledBy: Array<{ id: string; method: string; path: string; service: string }>;
}

export function toApiEndpointFull(raw: PrismaEndpoint): ApiEndpointFull {
  const endpoint = toEndpointFull(raw);
  const riBreakdown = toRIBreakdown(raw);
  const vulnerabilityBreakdown = toVulnBreakdown(raw);
  const calls = JSON.parse(raw.calls || '[]').map((c: any) => ({
    id: c.id,
    method: c.method,
    path: c.path,
    service: c.service,
  }));
  const calledBy = JSON.parse(raw.calledBy || '[]').map((c: any) => ({
    id: c.id,
    method: c.method,
    path: c.path,
    service: c.service,
  }));
  
  return {
    ...endpoint,
    id: parseInt(raw.id.replace(/\D/g, '')) || 0,
    vulnerabilityBreakdown,
    riBreakdown,
    calls,
    calledBy,
  };
}