import type { MLModel, DecayForecast } from "./types";
import { ML_MODELS } from "./decay";
import { getAtRiskEndpoints } from "./decay";
import type { Endpoint } from "./types";

export const ML_MODELS_REGISTRY: MLModel[] = ML_MODELS.map((m) => ({
  ...m,
  status: "active" as const,
}));

export function getDecayForecasts(endpoints: Endpoint[]): DecayForecast[] {
  return getAtRiskEndpoints(endpoints);
}

export function getMLModel(id: string): MLModel | undefined {
  return ML_MODELS_REGISTRY.find((m) => m.id === id);
}

export function getAllMLModels(): MLModel[] {
  return ML_MODELS_REGISTRY;
}