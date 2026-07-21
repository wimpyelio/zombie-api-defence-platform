import type { DecomState } from "./types";
export declare function createDecomState(endpointId: number, autoInitiated?: boolean): DecomState;
export declare function formatDPlus(initiatedAt: number, offsetMs: number): string;
export declare function currentDPlus(initiatedAt: number): string;
export declare function canAdvance(state: DecomState): boolean;
export declare function canRollback(state: DecomState): boolean;
export declare function advanceStage(state: DecomState, signoffConfirmed: boolean): {
    newState: DecomState;
    completed: boolean;
};
export declare function rollbackStage(state: DecomState): DecomState;
export declare function getCurrentStageInfo(state: DecomState): import("./types").StageConfig | undefined;
export declare function getStageProgress(state: DecomState): Array<{
    name: string;
    status: "complete" | "current" | "pending";
    icon: string;
}>;
export declare function generateObituaryReport(endpointId: number, endpoint: {
    path: string;
    method: string;
    service: string;
    gateway: string;
    deployedOn: string;
    state: string;
    ri: number;
    s: number;
    e: number;
    v: number;
    a: number;
    lastTraffic: string;
    lastCommit: string;
    owner: string;
    ownerActive: boolean;
    pci: boolean;
    auth: string;
    tls: string;
    rateLimited: boolean;
    wafCoverage: boolean;
    mtls: boolean;
    apiKeyExposed: boolean;
    egressVal: boolean;
}, state: DecomState): string;
//# sourceMappingURL=decommission.d.ts.map