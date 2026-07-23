/**
 * @zad/core - Core Domain Logic for Zombie API Defence Platform
 * 
 * Pure functions, types, and state machines. Zero dependencies.
 * All business logic lives here - no UI, no I/O, no side effects.
 */

// Export all types
export * from "./types.js";

// Scoring functions - primary API
export {
  computeV,
  getVulnBreakdown,
  type VulnBreakdown,
} from "./vulnerability.js";

export {
  computeRI,
  computeState,
  predictedZombieDate,
  getRIBand,
  getRIColor,
  computeRIBreakdown,
} from "./scoring.js";

// Decommission operations
export {
  createDecomState,
  advanceStage,
  rollbackStage,
  formatDPlus,
  currentDPlus,
  getCurrentStageInfo,
  getStageProgress,
  generateObituaryReport,
  STAGES,
} from "./decommission.js";

// Compliance
export {
  COMPLIANCE_MAPPINGS,
  getComplianceByRegulation,
  getComplianceStats,
  generateComplianceReport,
} from "./compliance.js";

// Knowledge graph
export {
  buildKnowledgeGraph,
  getNodeColor,
  getHighlightedNodes,
  renderKnowledgeGraph,
  toEndpointFull,
} from "./knowledge-graph.js";

// ML intelligence
export {
  ML_MODELS,
  computeDecayForecast,
  getAtRiskEndpoints,
  getMLModels,
  type DecayForecast,
  type AtRiskEndpoint,
  type MLModel,
} from "./ml-intelligence.js";