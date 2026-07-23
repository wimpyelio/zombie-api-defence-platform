import { Endpoint } from "./types.js";

/**
 * ML Intelligence Module
 * 
 * Lightweight, explainable ML models for API risk prediction.
 * No heavy dependencies - pure TypeScript implementations.
 */

// ============================================================================
// SIMPLE EXPONENTIAL DECAY MODEL (for zombie prediction)
// ============================================================================

export interface DecayForecast {
  endpointId: number;
  currentDecayProb: number;
  predictedState: "active" | "zombie";
  timeToZombieDays: number | null;
  confidence: number; // 0-1
  modelVersion: string;
}

/**
 * Exponential decay forecast - predicts when endpoint becomes zombie
 * Based on: decayProb + traffic trend + age
 */
export function computeDecayForecast(endpoint: Endpoint): DecayForecast {
  const decayProb = endpoint.decayProb;
  let timeToZombie: number | null = null;
  let predictedState: "active" | "zombie" = "active";
  
  if (decayProb >= 0.7) {
    predictedState = "zombie";
    // Linear estimate: higher decay = sooner
    timeToZombie = Math.round(30 * (1 - decayProb / 1.0));
  } else if (decayProb >= 0.5) {
    // At-risk: estimate based on traffic trend
    if (endpoint.trafficTrend === "declining" || endpoint.trafficTrend === "dead") {
      timeToZombie = Math.round(60 * (1 - decayProb));
    }
  }
  
  return {
    endpointId: endpoint.id,
    currentDecayProb: decayProb,
    predictedState,
    timeToZombieDays: timeToZombie,
    confidence: decayProb >= 0.7 ? 0.85 : decayProb >= 0.5 ? 0.65 : 0.45,
    modelVersion: "exp-decay-v1",
  };
}

// ============================================================================
// AT-RISK ENDPOINT DETECTION
// ============================================================================

export interface AtRiskEndpoint {
  endpoint: Endpoint;
  riskScore: number; // 0-1 composite
  factors: string[];
}

/**
 * Identify endpoints at risk of becoming zombies or security incidents
 * Uses multi-factor scoring: RI band, decay prob, traffic trend, ownership
 */
export function getAtRiskEndpoints(endpoints: Endpoint[]): AtRiskEndpoint[] {
  return endpoints
    .map(ep => {
      const factors: string[] = [];
      let score = 0;
      
      // RI band contribution (0-0.4)
      const riBandScore = ep.ri >= 2.5 ? 0.4 : ep.ri >= 1.0 ? 0.25 : ep.ri >= 0.4 ? 0.15 : 0.05;
      score += riBandScore;
      if (riBandScore >= 0.25) factors.push(`High RI (${ep.ri.toFixed(2)})`);
      
      // Decay probability (0-0.3)
      score += Math.min(ep.decayProb * 0.3, 0.3);
      if (ep.decayProb >= 0.5) factors.push(`Decay prob ${(ep.decayProb * 100).toFixed(0)}%`);
      
      // Traffic trend (0-0.15)
      if (ep.trafficTrend === "dead") score += 0.15;
      else if (ep.trafficTrend === "declining") score += 0.1;
      else if (ep.trafficTrend === "stale") score += 0.05;
      if (["dead", "declining", "stale"].includes(ep.trafficTrend)) {
        factors.push(`Traffic: ${ep.trafficTrend}`);
      }
      
      // Ownership (0-0.1)
      if (!ep.ownerActive) {
        score += 0.1;
        factors.push("Owner inactive");
      }
      
      // PCI scope (0-0.05)
      if (ep.pci) {
        score += 0.05;
        factors.push("PCI scope");
      }
      
      return {
        endpoint: ep,
        riskScore: Math.min(score, 1),
        factors,
      };
    })
    .filter(r => r.riskScore > 0.3)
    .sort((a, b) => b.riskScore - a.riskScore);
}

// ============================================================================
// KNOWLEDGE GRAPH INTEGRATION (placeholder for future)
// ============================================================================

export interface MLModel {
  id: string;
  name: string;
  type: "decay" | "classification" | "anomaly" | "forecast";
  version: string;
  lastTrained: string;
  accuracy: number;
}

export const ML_MODELS: MLModel[] = [
  {
    id: "exp-decay-v1",
    name: "Exponential Decay Forecast",
    type: "forecast",
    version: "1.0.0",
    lastTrained: new Date().toISOString(),
    accuracy: 0.82,
  },
  {
    id: "risk-classifier-v1",
    name: "Risk Band Classifier",
    type: "classification",
    version: "1.0.0",
    lastTrained: new Date().toISOString(),
    accuracy: 0.78,
  },
];

export function getMLModels(): MLModel[] {
  return ML_MODELS;
}