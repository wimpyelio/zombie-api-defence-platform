import { describe, it, expect } from "vitest";
import {
  computeV,
  computeRiskIndex,
  getRIBand,
  buildEndpoint,
  computeRIBreakdown,
  computeState,
} from "./scoring";
import type { EndpointRaw, VulnerabilityWeights } from "./types";

const defaultWeights: VulnerabilityWeights = {
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
  sunsetHeader: false,
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
  sunsetHeader: false,
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

describe("Scoring Functions", () => {
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

  describe("computeRiskIndex", () => {
    it("computes RI for zombie endpoint: (0.9*0.6) + (1.75/13) = 0.54 + 0.135 = 0.675", () => {
      const ri = computeRiskIndex(zombieEndpoint, defaultWeights);
      expect(ri).toBe(0.675);
    });

    it("computes RI for secure endpoint: (0.9*0.6) + (0/3) = 0.54", () => {
      const ri = computeRiskIndex(secureEndpoint, defaultWeights);
      expect(ri).toBe(0.54);
    });

    it("handles high RI for new vulnerable endpoint", () => {
      const newVuln = { ...zombieEndpoint, a: 1 }; // age = 1 month
      const ri = computeRiskIndex(newVuln, defaultWeights);
      // (0.9*0.6) + (1.75/1) = 0.54 + 1.75 = 2.29
      expect(ri).toBe(2.29);
    });

    it("never returns negative RI", () => {
      const impossible = { ...secureEndpoint, s: 0, e: 0, a: 100 };
      const ri = computeRiskIndex(impossible, defaultWeights);
      expect(ri).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getRIBand", () => {
    it("returns Critical for RI > 2.5", () => {
      expect(getRIBand(3.0)).toBe("Critical");
      expect(getRIBand(2.51)).toBe("Critical");
    });

    it("returns High for 1.5 < RI <= 2.5", () => {
      expect(getRIBand(2.5)).toBe("High");
      expect(getRIBand(1.51)).toBe("High");
    });

    it("returns Medium for 0.8 < RI <= 1.5", () => {
      expect(getRIBand(1.5)).toBe("Medium");
      expect(getRIBand(0.81)).toBe("Medium");
    });

    it("returns Low for RI <= 0.8", () => {
      expect(getRIBand(0.8)).toBe("Low");
      expect(getRIBand(0)).toBe("Low");
    });
  });

  describe("buildEndpoint", () => {
    it("builds complete endpoint with derived fields", () => {
      const endpoint = buildEndpoint(zombieEndpoint, defaultWeights);
      
      expect(endpoint.id).toBe(1);
      expect(endpoint.state).toBe("zombie");
      expect(endpoint.v).toBe(1.75);
      expect(endpoint.ri).toBe(0.675);
      expect(endpoint.riBand).toBe("Low");
      expect(endpoint.predictedZombieDate).toBeNull(); // already zombie
    });

    it("builds secure endpoint as active", () => {
      const endpoint = buildEndpoint(secureEndpoint, defaultWeights);
      
      expect(endpoint.state).toBe("active");
      expect(endpoint.v).toBe(0);
      expect(endpoint.ri).toBe(0.54);
      expect(endpoint.riBand).toBe("Low");
    });

    it("computes predicted zombie date for at-risk active endpoints", () => {
      const atRisk = { ...secureEndpoint, decayProb: 0.8, a: 6 }; // 6 months old, high decay
      const endpoint = buildEndpoint(atRisk, defaultWeights);
      
      expect(endpoint.predictedZombieDate).not.toBeNull();
      expect(endpoint.predictedZombieDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO 8601
    });

    it("returns null predicted date for low decay probability", () => {
      const lowRisk = { ...secureEndpoint, decayProb: 0.3, a: 6 };
      const endpoint = buildEndpoint(lowRisk, defaultWeights);
      
      expect(endpoint.predictedZombieDate).toBeNull();
    });
  });

  describe("computeRIBreakdown", () => {
    it("produces correct breakdown for zombie endpoint", () => {
      const endpoint = buildEndpoint(zombieEndpoint, defaultWeights);
      const breakdown = computeRIBreakdown(endpoint);
      
      expect(breakdown.endpoint).toBe("/api/v1/legacy/payment/refund");
      expect(breakdown.state).toBe("zombie");
      expect(breakdown.sTimesE).toBe(0.54);
      expect(breakdown.v).toBe(1.75);
      expect(breakdown.a).toBe(13);
      expect(breakdown.vOverA).toBeCloseTo(0.135, 3);
      expect(breakdown.ri).toBe(0.675);
      expect(breakdown.band).toBe("Low");
    });

    it("flags zombie+PCI as AUTO response when RI > 0.8", () => {
      // Need zombie state (a>=12) AND RI > 0.8
      // For a=13: RI = 0.54 + 1.75/13 = 0.54 + 0.135 = 0.675 (too low)
      // For a=1: RI = 0.54 + 1.75 = 2.29 (high) but a<12 so not zombie
      // For a=2: RI = 0.54 + 1.75/2 = 0.54 + 0.875 = 1.415 (good) but a<12
      // Need a>=12 for zombie AND RI > 0.8
      // With a=12: RI = 0.54 + 1.75/12 = 0.54 + 0.146 = 0.686 (too low)
      // Let's make it more vulnerable: add apiKeyExposed and increase s/e
      const highRiZombie = { 
        ...zombieEndpoint, 
        a: 13, 
        s: 0.95, 
        e: 1.0,
        auth: "none" as const,
        rateLimited: false,
        wafCoverage: false,
        mtls: false,
        apiKeyExposed: true,
        tls: "1.0" as const,
        egressVal: false,
      };
      const endpoint = buildEndpoint(highRiZombie, defaultWeights);
      
      const breakdown = computeRIBreakdown(endpoint);
      
      expect(breakdown.pciAutoResp).toBe("🔴 AUTO");
    });

    it("flags Critical RI + PCI as P0 when RI > 2.5", () => {
      // Need RI > 2.5 for P0: use a=1, e=1.0, s=0.95
      const criticalEndpoint: EndpointRaw = {
        ...zombieEndpoint,
        a: 1,
        e: 1.0,
        s: 0.95,
      };
      const endpoint = buildEndpoint(criticalEndpoint, defaultWeights);
      const breakdown = computeRIBreakdown(endpoint);
      
      expect(breakdown.pciAutoResp).toBe("🔴 P0");
    });
  });
});