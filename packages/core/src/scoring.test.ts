import { describe, it, expect } from "vitest";
import { computeV, getVulnBreakdown, type VulnBreakdown } from "./vulnerability.js";
import { computeRI, getRIBand, computeRIBreakdown, computeState, predictedZombieDate } from "./scoring.js";
import type { EndpointRaw, VulnWeights, Endpoint } from "./types.js";

const defaultWeights: VulnWeights = {
  noAuth: 0.35,
  noMTLS: 0.25,
  noRate: 0.20,
  weakTLS: 0.15,
  expKey: 0.40,
  noWAF: 0.30,
  noEgress: 0.10,
};

const zombieEndpoint: EndpointRaw = {
  id: 1,
  method: "POST",
  path: "/api/v1/legacy/payment/refund",
  service: "payment-svc",
  s: 0.9,
  e: 0.6,
  a: 13,
  pci: true,
  auth: "none",
  tls: "1.1",
  rateLimited: false,
  wafCoverage: false,
  mtls: false,
  apiKeyExposed: true,
  egressVal: false,
  owner: "svc-batch-01",
  ownerActive: false,
  sunsetHeader: "2024-01-15",
  trafficTrend: "stale",
  trafficP90: 42,
  lastTraffic: "2d ago",
  lastCommit: "13mo ago",
  decayProb: 0.96,
  gateway: "kong",
  deployedOn: "k8s-prod-01",
  calledBy: [7],
  calls: [],
};

const secureEndpoint: EndpointRaw = {
  id: 10,
  method: "POST",
  path: "/api/v1/transfer/neft",
  service: "payment-svc",
  s: 0.9,
  e: 0.6,
  a: 3,
  pci: true,
  auth: "oauth2",
  tls: "1.3",
  rateLimited: true,
  wafCoverage: true,
  mtls: true,
  apiKeyExposed: false,
  egressVal: true,
  owner: "payments-team",
  ownerActive: true,
  sunsetHeader: "",
  trafficTrend: "stable",
  trafficP90: 45000,
  lastTraffic: "3s ago",
  lastCommit: "3mo ago",
  decayProb: 0.04,
  gateway: "apigee",
  deployedOn: "k8s-prod-01",
  calledBy: [2, 15],
  calls: [14],
};

function buildEndpoint(raw: EndpointRaw, weights: VulnWeights = defaultWeights): Endpoint {
  const v = computeV(raw, weights);
  const ri = computeRI(raw, weights);
  const state = computeState(raw);
  const predictedZombieDateResult = predictedZombieDate(raw);
  const riBand = getRIBand(ri);
  
  return {
    ...raw,
    v,
    ri,
    state,
    predictedZombieDate: predictedZombieDateResult,
    riBand,
  };
}

describe("Vulnerability Functions", () => {
  describe("computeV", () => {
    it("computes maximum vulnerability for zombie endpoint", () => {
      const v = computeV(zombieEndpoint, defaultWeights);
      // noAuth(0.35) + noMTLS(0.25) + noRate(0.20) + weakTLS(0.15) + expKey(0.40) + noWAF(0.30) + noEgress(0.10) = 1.75
      expect(v).toBe(1.75);
    });

    it("computes zero vulnerability for fully secure endpoint", () => {
      const v = computeV(secureEndpoint, defaultWeights);
      expect(v).toBe(0);
    });

    it("handles basic auth as vulnerable", () => {
      const basicAuth = { ...secureEndpoint, auth: "basic" as const };
      const v = computeV(basicAuth, defaultWeights);
      expect(v).toBe(0.35);
    });

    it("handles api_key auth as vulnerable", () => {
      const apiKey = { ...secureEndpoint, auth: "api_key" as const };
      const v = computeV(apiKey, defaultWeights);
      expect(v).toBe(0.35);
    });

    it("handles jwt and oauth2 as secure", () => {
      const jwt = { ...secureEndpoint, auth: "jwt" as const };
      const oauth = { ...secureEndpoint, auth: "oauth2" as const };
      expect(computeV(jwt, defaultWeights)).toBe(0);
      expect(computeV(oauth, defaultWeights)).toBe(0);
    });
  });

  describe("getVulnBreakdown", () => {
    it("returns correct breakdown for zombie endpoint", () => {
      const breakdown = getVulnBreakdown(zombieEndpoint, defaultWeights);
      expect(breakdown.total).toBe(1.75);
      expect(breakdown.noAuth).toBe(true);
      expect(breakdown.noMTLS).toBe(true);
      expect(breakdown.noRate).toBe(true);
      expect(breakdown.weakTLS).toBe(true);
      expect(breakdown.expKey).toBe(true);
      expect(breakdown.noWAF).toBe(true);
      expect(breakdown.noEgress).toBe(true);
    });

    it("returns empty breakdown for secure endpoint", () => {
      const breakdown = getVulnBreakdown(secureEndpoint, defaultWeights);
      expect(breakdown.total).toBe(0);
      expect(Object.values(breakdown).slice(0, 7).every(v => !v)).toBe(true);
    });
  });
});

describe("Scoring Functions", () => {
  describe("computeRI", () => {
    it("computes RI for zombie endpoint: (0.9*0.6) * (1.75/13) = 0.54 * 0.135 = 0.0729", () => {
      const ri = computeRI(zombieEndpoint, defaultWeights);
      expect(ri).toBe(0.073); // 0.54 * (1.75/13) = 0.07269... rounded to 3 decimal = 0.073
    });

    it("computes RI for secure endpoint: (0.9*0.6) * (0/3) = 0", () => {
      const ri = computeRI(secureEndpoint, defaultWeights);
      expect(ri).toBe(0);
    });

    it("handles high RI for new vulnerable endpoint", () => {
      const newVuln = { ...zombieEndpoint, a: 1 }; // age = 1 month
      const ri = computeRI(newVuln, defaultWeights);
      // (0.9*0.6) * (1.75/1) = 0.54 * 1.75 = 0.945
      expect(ri).toBe(0.945);
    });

    it("never returns negative RI", () => {
      const impossible = { ...secureEndpoint, s: 0, e: 0, a: 100 };
      const ri = computeRI(impossible, defaultWeights);
      expect(ri).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getRIBand", () => {
    it("returns Critical for RI >= 2.5", () => {
      expect(getRIBand(3.0)).toBe("Critical");
      expect(getRIBand(2.5)).toBe("Critical");
    });

    it("returns High for 1.0 <= RI < 2.5", () => {
      expect(getRIBand(2.5)).toBe("Critical"); // boundary is >= 2.5 for Critical
      expect(getRIBand(2.49)).toBe("High");
      expect(getRIBand(1.0)).toBe("High");
    });

    it("returns Medium for 0.4 <= RI < 1.0", () => {
      expect(getRIBand(1.0)).toBe("High"); // boundary is >= 1.0 for High
      expect(getRIBand(0.99)).toBe("Medium");
      expect(getRIBand(0.4)).toBe("Medium");
    });

    it("returns Low for RI < 0.4", () => {
      expect(getRIBand(0.4)).toBe("Medium"); // boundary is >= 0.4 for Medium
      expect(getRIBand(0.39)).toBe("Low");
      expect(getRIBand(0)).toBe("Low");
    });
  });

  describe("computeState / predictedZombieDate", () => {
    it("identifies zombie endpoint (stale traffic + inactive owner)", () => {
      const state = computeState(zombieEndpoint);
      expect(state).toBe("zombie");
    });

    it("identifies active endpoint", () => {
      const state = computeState(secureEndpoint);
      expect(state).toBe("active");
    });

    it("computes predicted zombie date for at-risk active endpoints", () => {
      const atRisk = { ...secureEndpoint, decayProb: 0.8, a: 6 };
      const date = predictedZombieDate(atRisk);
      
      expect(date).not.toBeNull();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO 8601
    });

    it("returns null predicted date for low decay probability", () => {
      const lowRisk = { ...secureEndpoint, decayProb: 0.3, a: 6 };
      const date = predictedZombieDate(lowRisk);
      
      expect(date).toBeNull();
    });
  });

  describe("computeRIBreakdown", () => {
    it("produces correct breakdown for zombie endpoint", () => {
      const endpoint = buildEndpoint(zombieEndpoint, defaultWeights);
      const breakdown = computeRIBreakdown(endpoint);
      
      expect(breakdown.endpoint.id).toBe(1);
      expect(breakdown.endpoint.state).toBe("zombie");
      expect(breakdown.seProduct).toBe(0.54);
      expect(breakdown.v).toBe(1.75);
      expect(breakdown.a).toBe(13);
      expect(breakdown.vOverA).toBeCloseTo(0.135, 3);
      expect(breakdown.ri).toBe(0.073);
      expect(breakdown.band).toBe("Low");
      expect(breakdown.autoResponse).toBe(false); // RI = 0.073 < 0.8
    });

    it("flags zombie+PCI as AUTO response when RI > 0.8", () => {
      // Need zombie state (stale traffic + inactive owner) AND RI > 0.8
      // With a=13: RI = 0.54 * (1.75/13) = 0.073 (too low)
      // Need higher s*e or lower a. Use a=1 for high RI, but need zombie state
      // For zombie: need stale traffic + inactive owner. Age doesn't matter for state.
      const highRiZombie = { 
        ...zombieEndpoint, 
        a: 1, // young but stale+inactive = zombie
        s: 1.0, 
        e: 1.0,
      };
      const endpoint = buildEndpoint(highRiZombie, defaultWeights);
      
      const breakdown = computeRIBreakdown(endpoint);
      
      expect(breakdown.autoResponse).toBe(true);
    });

    it("flags Critical RI as P0 when RI >= 2.5", () => {
      // Need RI >= 2.5: se * (v/a) >= 2.5
      // With v=1.75, a=0.1: se * 17.5 >= 2.5 => se >= 0.143
      const criticalEndpoint: EndpointRaw = {
        ...zombieEndpoint,
        a: 0.1, // minimum age
        s: 1.0,
        e: 1.0,
        auth: "none",
        tls: "1.0",
        rateLimited: false,
        wafCoverage: false,
        mtls: false,
        apiKeyExposed: true,
        egressVal: false,
      };
      const endpoint = buildEndpoint(criticalEndpoint, defaultWeights);
      const breakdown = computeRIBreakdown(endpoint);
      
      expect(breakdown.p0Escalation).toBe(true);
    });
  });
});