/**
 * @zad/core - Core Domain Logic for Zombie API Defence Platform
 *
 * Pure functions, types, and state machines. Zero dependencies.
 * All business logic lives here - no UI, no I/O, no side effects.
 */
export * from "./types";
export { computeV, getVulnBreakdown, type VulnBreakdown, } from "./vulnerability";
export { computeRI, computeState, predictedZombieDate, getRIBand, getRIColor, computeRIBreakdown, } from "./scoring";
export { createDecomState, advanceStage, rollbackStage, formatDPlus, currentDPlus, generateObituaryReport, } from "./decommission";
export { COMPLIANCE_MAPPINGS, getComplianceByRegulation, getComplianceStats, generateComplianceReport, } from "./compliance";
export { buildKnowledgeGraph, getNodeColor, getHighlightedNodes, renderKnowledgeGraph, } from "./knowledge-graph";
export { ML_MODELS, computeDecayForecast, getAtRiskEndpoints, getMLModels, type DecayForecast, type AtRiskEndpoint, type MLModel, } from "./ml-intelligence";
//# sourceMappingURL=index.d.ts.map