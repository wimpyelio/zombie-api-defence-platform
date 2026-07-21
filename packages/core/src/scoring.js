import { DEFAULT_VULN_WEIGHTS } from "./types";
import { computeV } from "./vulnerability";
/**
 * Compute Risk Index (RI) = (S × E) × (V / A)
 *
 * S = Sensitivity [0-1], E = Exposure [0-1], V = Vulnerability composite, A = Age (months)
 * RI captures: risk per unit of neglect. High S×E + high V + low A = immediate danger.
 */
export function computeRI(ep, weights = DEFAULT_VULN_WEIGHTS) {
    const se = ep.s * ep.e;
    const v = computeV(ep, weights);
    const a = Math.max(ep.a, 0.1); // Avoid division by zero, minimum 0.1 months
    const ri = se * (v / a);
    return parseFloat(ri.toFixed(3));
}
/**
 * Map RI to risk band
 */
export function getRIBand(ri) {
    if (ri >= 2.5)
        return "Critical";
    if (ri >= 1.0)
        return "High";
    if (ri >= 0.4)
        return "Medium";
    return "Low";
}
/**
 * Get color for RI band (for UI)
 */
export function getRIColor(ri) {
    const band = getRIBand(ri);
    switch (band) {
        case "Critical": return "#dc2626"; // red-600
        case "High": return "#ea580c"; // orange-600
        case "Medium": return "#ca8a04"; // yellow-600
        case "Low": return "#16a34a"; // green-600
    }
}
/**
 * Full RI breakdown with all components
 */
export function computeRIBreakdown(ep, weights = DEFAULT_VULN_WEIGHTS) {
    const v = computeV(ep, weights);
    const seProduct = ep.s * ep.e;
    const a = Math.max(ep.a, 0.1);
    const vOverA = v / a;
    const ri = computeRI(ep, weights);
    const band = getRIBand(ri);
    // Zombie + PCI + RI > 0.8 = AUTO response
    const isZombie = computeState(ep) === "zombie";
    const isPCI = ep.pci;
    const autoResponse = isZombie && isPCI && ri > 0.8;
    // RI > 2.5 = P0 escalation
    const p0Escalation = ri > 2.5;
    return {
        endpoint: ep,
        seProduct: parseFloat(seProduct.toFixed(3)),
        v,
        a,
        vOverA: parseFloat(vOverA.toFixed(3)),
        ri,
        band,
        riBand: band, // Alias for interface
        autoResponse,
        p0Escalation,
    };
}
/**
 * Compute lifecycle state from raw endpoint data
 */
export function computeState(ep) {
    // Dead/Stale traffic + no owner = zombie
    if ((ep.trafficTrend === "dead" || ep.trafficTrend === "stale") && !ep.ownerActive) {
        return "zombie";
    }
    // Explicit sunset header = deprecated
    if (ep.sunsetHeader) {
        return "deprecated";
    }
    // No owner + no recent traffic = orphaned
    if (!ep.ownerActive && (ep.trafficTrend === "stale" || ep.trafficTrend === "dead")) {
        return "orphaned";
    }
    return "active";
}
/**
 * Predict zombie date based on decay probability and traffic trend
 * Simple linear extrapolation: if decayProb > 0.5 and traffic declining, estimate
 */
export function predictedZombieDate(ep) {
    const state = computeState(ep);
    if (state === "zombie" || ep.decayProb < 0.5)
        return null;
    const monthsToZombie = Math.max(1, Math.round(12 * (1 - ep.decayProb)));
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToZombie);
    const isoString = date.toISOString().split("T")[0];
    return isoString ?? null;
}
//# sourceMappingURL=scoring.js.map