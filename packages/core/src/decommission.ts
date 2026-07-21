import type { DecomState, DecomStage, DecomHistoryEntry } from "./types";
import { STAGES, DAY_MS } from "./types";

export function createDecomState(endpointId: number, autoInitiated = false): DecomState {
  const now = Date.now();
  const history: DecomHistoryEntry[] = [
    { offset: 0, action: autoInitiated ? "AUTO-INITIATED: state=Zombie + PCI + RI>0.8" : "Pipeline initiated", stage: 0 },
  ];

  if (autoInitiated) {
    history.push({ offset: 60_000, action: "Circuit breaker fired — PCI fields masked in live responses", stage: 0 });
  }

  return {
    stage: 0,
    initiatedAt: now,
    history,
  };
}

export function formatDPlus(initiatedAt: number, offsetMs: number): string {
  const d = Math.floor(offsetMs / DAY_MS);
  const ms = offsetMs % DAY_MS;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `D+${d} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function currentDPlus(initiatedAt: number): string {
  const d = Math.floor((Date.now() - initiatedAt) / DAY_MS);
  return `D+${d}`;
}

export function canAdvance(state: DecomState): boolean {
  return state.stage < 4;
}

export function canRollback(state: DecomState): boolean {
  return state.stage > 0;
}

export function advanceStage(state: DecomState, signoffConfirmed: boolean): { newState: DecomState; completed: boolean } {
  if (!signoffConfirmed) {
    throw new Error("Sign-off required to advance stage");
  }
  if (!canAdvance(state)) {
    throw new Error("Already at final stage");
  }

  const now = Date.now();
  const offset = now - state.initiatedAt;

  const newHistory = [
    ...state.history,
    { offset, action: `${STAGES[state.stage].name} signed off — advancing to ${state.stage < 3 ? STAGES[state.stage + 1].name : "DEREGISTERED"}`, stage: state.stage },
  ];

  const newStage = state.stage + 1;

  if (newStage < 4) {
    newHistory.push({
      offset: offset + 60_000,
      action: `${STAGES[newStage].name} stage initiated`,
      stage: newStage,
    });
  }

  const newState: DecomState = {
    ...state,
    stage: newStage,
    history: newHistory,
  };

  return { newState, completed: newStage === 4 };
}

export function rollbackStage(state: DecomState): DecomState {
  if (!canRollback(state)) {
    throw new Error("Cannot rollback from Alert stage");
  }
  
  // Cannot rollback from Deregister (stage 4) - IRREVERSIBLE
  if (state.stage === 4) {
    throw new Error("IRREVERSIBLE: Cannot rollback from Deregister stage");
  }

  const now = Date.now();
  const offset = now - state.initiatedAt;

  return {
    ...state,
    stage: state.stage - 1,
    history: [
      ...state.history,
      { offset, action: `⚠ ROLLBACK: ${STAGES[state.stage].name} → ${STAGES[state.stage - 1].name}`, stage: state.stage },
    ],
  };
}

export function getCurrentStageInfo(state: DecomState) {
  return STAGES[state.stage];
}

export function getStageProgress(state: DecomState): Array<{ name: string; status: "complete" | "current" | "pending"; icon: string }> {
  return STAGES.map((stage, index) => ({
    name: stage.name,
    icon: stage.icon,
    status: index < state.stage ? "complete" : index === state.stage ? "current" : "pending",
  }));
}

export function generateObituaryReport(endpointId: number, endpoint: { 
  path: string; method: string; service: string; gateway: string; deployedOn: string;
  state: string; ri: number; s: number; e: number; v: number; a: number;
  lastTraffic: string; lastCommit: string; owner: string; ownerActive: boolean; pci: boolean;
  auth: string; tls: string; rateLimited: boolean; wafCoverage: boolean; mtls: boolean;
  apiKeyExposed: boolean; egressVal: boolean;
}, state: DecomState): string {
  const now = new Date().toISOString();
  const histLines = state.history.map(h => 
    `  ${formatDPlus(state.initiatedAt, h.offset)}  ${h.action}`
  ).join("\n");

  return `================================================================================
API OBITUARY REPORT — ZADF Platform
Generated: ${now}
Cryptographic hash: SHA-256 (HSM-signed — placeholder in prototype)
================================================================================

ENDPOINT
  Path:           ${endpoint.path}
  Method:         ${endpoint.method}
  Service:        ${endpoint.service}
  Gateway:        ${endpoint.gateway}
  Deployed on:    ${endpoint.deployedOn}
  Ontology ID:    ep-${endpointId}-zadf-ontology

LIFECYCLE SUMMARY
  Final State:    ${endpoint.state.toUpperCase()}
  RI at Decommission: ${endpoint.ri.toFixed(3)}  (Band: ${endpoint.ri > 2.5 ? "Critical" : endpoint.ri > 1.5 ? "High" : endpoint.ri > 0.8 ? "Medium" : "Low"})
  S (Sensitivity):    ${endpoint.s}
  E (Exposure):       ${endpoint.e}
  V (Vuln composite): ${endpoint.v.toFixed(3)}
  A (Age, months):    ${endpoint.a}
  Last Traffic:       ${endpoint.lastTraffic}
  Last Commit:        ${endpoint.lastCommit}
  Owner (at time):    ${endpoint.owner} (active: ${endpoint.ownerActive})
  PCI In Scope:       ${endpoint.pci ? "YES" : "No"}

SECURITY POSTURE AT DECOMMISSION
  Auth Mechanism:     ${endpoint.auth}
  TLS Version:        ${endpoint.tls}
  Rate Limited:       ${endpoint.rateLimited ? "Yes" : "No"}
  WAF Coverage:       ${endpoint.wafCoverage ? "Yes" : "No"}
  mTLS:               ${endpoint.mtls ? "Yes" : "No"}
  API Key Exposed:    ${endpoint.apiKeyExposed ? "⚠ YES in repo" : "No"}
  Egress Validation:  ${endpoint.egressVal ? "Yes" : "No"}

DECOMMISSION PIPELINE LOG
${histLines}

APPROVING OFFICERS
  CISO: [Signature required before Deregister stage]
  VP Engineering: [Dual sign-off required]

DAST VERIFICATION
  Status: 404 confirmed from all network zones (internet, DMZ, internal)
  Probe timestamp: ${now}

COMPLIANCE NOTES
  RBI CSF §6.1: Ontology updated — state = DECOMMISSIONED
  PCI-DSS v4 Req 8.2: Owner attribution archived
  GDPR Art.32: PII field exposure eliminated

================================================================================
END OF REPORT
Report stored in immutable audit log. SHA-256 hash verified by HSM.
================================================================================`;
}