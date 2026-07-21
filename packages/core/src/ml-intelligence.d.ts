import { Endpoint } from "./types";
/**
 * ML Intelligence Module
 *
 * Lightweight, explainable ML models for API risk prediction.
 * No heavy dependencies - pure TypeScript implementations.
 */
export interface DecayForecast {
    endpointId: number;
    currentDecayProb: number;
    predictedState: "active" | "zombie";
    timeToZombieDays: number | null;
    confidence: number;
    modelVersion: string;
}
/**
 * Exponential decay forecast - predicts when endpoint becomes zombie
 * Based on: decayProb + traffic trend + age
 */
export declare function computeDecayForecast(endpoint: Endpoint): DecayForecast;
export interface AtRiskEndpoint {
    endpoint: Endpoint;
    riskScore: number;
    factors: string[];
}
/**
 * Identify endpoints at risk of becoming zombies or security incidents
 * Uses multi-factor scoring: RI band, decay prob, traffic trend, ownership
 */
export declare function getAtRiskEndpoints(endpoints: Endpoint[]): AtRiskEndpoint[];
export interface MLModel {
    id: string;
    name: string;
    type: "decay" | "classification" | "anomaly" | "forecast";
    version: string;
    lastTrained: string;
    accuracy: number;
}
export declare const ML_MODELS: MLModel[];
export declare function getMLModels(): MLModel[];
//# sourceMappingURL=ml-intelligence.d.ts.map