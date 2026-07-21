import { EndpointRaw, Endpoint, VulnWeights, RIBand, RIBreakdown, LifecycleState } from "./types";
/**
 * Compute Risk Index (RI) = (S × E) × (V / A)
 *
 * S = Sensitivity [0-1], E = Exposure [0-1], V = Vulnerability composite, A = Age (months)
 * RI captures: risk per unit of neglect. High S×E + high V + low A = immediate danger.
 */
export declare function computeRI(ep: EndpointRaw, weights?: VulnWeights): number;
/**
 * Map RI to risk band
 */
export declare function getRIBand(ri: number): RIBand;
/**
 * Get color for RI band (for UI)
 */
export declare function getRIColor(ri: number): string;
/**
 * Full RI breakdown with all components
 */
export declare function computeRIBreakdown(ep: Endpoint, weights?: VulnWeights): RIBreakdown;
/**
 * Compute lifecycle state from raw endpoint data
 */
export declare function computeState(ep: EndpointRaw): LifecycleState;
/**
 * Predict zombie date based on decay probability and traffic trend
 * Simple linear extrapolation: if decayProb > 0.5 and traffic declining, estimate
 */
export declare function predictedZombieDate(ep: EndpointRaw): string | null;
//# sourceMappingURL=scoring.d.ts.map