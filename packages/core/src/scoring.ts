import {
  EndpointRaw,
  Endpoint,
  DEFAULT_VULN_WEIGHTS,
  VulnerabilityWeights,
  RIband,
  RIbreakdownRow,
  LifecycleState,
} from "./types";
import { computeV } from "./vulnerability";

/**
 * Lifecycle state classification from raw security signals
 * 
 * Rules (in priority order):
 * 1. Zombie: a≥12 AND !rateLimited AND !wafCoverage AND auth ∈ {none,basic,api_key} AND trafficTrend !== 'dead'
 * 2. Orphaned: !ownerActive AND trafficTrend !== 'dead'
 * 3. Deprecated: sunsetHeader AND (trafficTrend === 'declining' OR trafficTrend === 'stale')
 * 4. Active: everything else
 * 
 * State is DERIVED from security signals, never the reverse.
 * This is a critical architectural principle: security signals → state.
 */

export function computeState(ep: EndpointRaw): LifecycleState {
  // Zombie: The danger zone - reachable + unmaintained + unprotected + legacy auth
  if (
    ep.a >= 12 &&
    !ep.rateLimited &&
    !ep.wafCoverage &&
    ["none", "basic", "api_key"].includes(ep.auth) &&
    ep.trafficTrend !== "dead"
  ) {
    return "zombie";
  }

  // Orphaned: Running with no living owner
  if (!ep.ownerActive && ep.trafficTrend !== "dead") {
    return "orphaned";
  }

  // Deprecated: Scheduled for retirement
  if (ep.sunsetHeader && (ep.trafficTrend === "declining" || ep.trafficTrend === "stale")) {
    return "deprecated";
  }

  return "active";
}

/**
 * Predictive decay forecasting - estimates when an active endpoint
 * will reach zombie classification threshold (a ≥ 12)
 */
export function computePredictedZombieDate(ep: Omit<EndpointRaw, "state" | "v" | "ri"> & { state: LifecycleState; v: number; ri: number }): string | null {
  // Already zombie or orphaned - no prediction needed
  if (ep.state === "zombie" || ep.state === "orphaned") {
    return null;
  }

  // Low decay probability - no meaningful prediction
  if (ep.decayProb < 0.5) {
    return null;
  }

  // Months until age threshold for zombie classification
  const monthsUntilAgeThreshold = Math.max(0, 12 - ep.a);
  
  if (monthsUntilAgeThreshold === 0) {
    // Already at age threshold, could become zombie any month
    const days = Math.round(30 / (ep.decayProb * 1.4));
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  }

  // Probability-weighted acceleration: higher decay_prob = faster
  const accelerationFactor = ep.decayProb * 1.4;
  const estimatedDays = Math.round((monthsUntilAgeThreshold * 30) / accelerationFactor);
  
  const date = new Date();
  date.setDate(date.getDate() + estimatedDays);
  
  return date.toISOString().split("T")[0]; // ISO 8601 date (YYYY-MM-DD)
}

/**
 * Compute vulnerability composite (V) from raw security properties
 */
export function computeVScore(ep: EndpointRaw, weights: VulnerabilityWeights = DEFAULT_VULN_WEIGHTS): number {
  let v = 0;
  if (["none", "basic", "api_key"].includes(ep.auth)) v += weights.noAuth;
  if (!ep.mtls) v += weights.noMTLS;
  if (!ep.rateLimited) v += weights.noRate;
  if (ep.tls === "1.0" || ep.tls === "1.1") v += weights.weakTLS;
  if (ep.apiKeyExposed) v += weights.expKey;
  if (!ep.wafCoverage) v += weights.noWAF;
  if (!ep.egressVal) v += weights.noEgress;
  return Number(v.toFixed(3));
}

/**
 * Compute Risk Index
 */
export function computeRiskIndex(ep: EndpointRaw, weights: VulnerabilityWeights = DEFAULT_VULN_WEIGHTS): number {
  const v = computeVScore(ep, weights);
  return Number(((ep.s * ep.e) + (v / ep.a)).toFixed(3));
}

/**
 * Get RI band
 */
export function getRIBand(ri: number): RIband {
  if (ri > 2.5) return "Critical";
  if (ri > 1.5) return "High";
  if (ri > 0.8) return "Medium";
  return "Low";
}

/**
 * Build complete endpoint with all derived fields
 * Single source of truth for endpoint construction
 */
export function buildEndpoint(ep: EndpointRaw, weights: VulnerabilityWeights = DEFAULT_VULN_WEIGHTS): Endpoint {
  const v = computeVScore(ep, weights);
  const ri = computeRiskIndex(ep, weights);
  const state = computeState(ep);
  const predictedZombieDate = computePredictedZombieDate({ ...ep, state, v, ri });

  return {
    ...ep,
    state,
    v,
    ri,
    riBand: getRIBand(ri),
    predictedZombieDate,
  };
}

/**
 * Compute RI breakdown row for tabular display
 */
export function computeRIBreakdown(ep: Endpoint): RIbreakdownRow {
  const sTimesE = Number((ep.s * ep.e).toFixed(3));
  const vOverA = Number((ep.v / ep.a).toFixed(3));
  const isAutoResp = ep.state === "zombie" && ep.pci && ep.ri > 0.8;
  const isP0 = ep.ri > 2.5 && ep.pci;

  let pciAutoResp = "—";
  if (isAutoResp) pciAutoResp = "🔴 AUTO";
  else if (isP0) pciAutoResp = "🔴 P0";

  return {
    endpoint: ep.path,
    state: ep.state,
    sTimesE,
    v: ep.v,
    a: ep.a,
    vOverA,
    ri: ep.ri,
    band: ep.riBand,
    pciAutoResp,
  };
}

// Re-export from vulnerability for backward compatibility
export { computeV } from "./vulnerability";
export type { VulnerabilityWeights } from "./vulnerability";