import { describe, it, expect } from "vitest";
import { createDecomState, advanceStage, rollbackStage, formatDPlus, currentDPlus, generateObituaryReport, } from "./decommission";
import { STAGES } from "./types";
describe("Decommission State Machine", () => {
    describe("createDecomState", () => {
        it("creates initial state at Alert stage", () => {
            const state = createDecomState(1, false);
            expect(state.stage).toBe(0);
            expect(state.initiatedAt).toBeGreaterThan(0);
            expect(state.history).toHaveLength(1);
            expect(state.history[0].action).toBe("Pipeline initiated");
            expect(state.history[0].stage).toBe(0);
        });
        it("creates auto-initiated state for zombie+PCI+RI>0.8", () => {
            const state = createDecomState(1, true);
            expect(state.stage).toBe(0);
            expect(state.history).toHaveLength(2);
            expect(state.history[0].action).toContain("AUTO-INITIATED");
            expect(state.history[1].action).toContain("Circuit breaker");
        });
    });
    describe("advanceStage", () => {
        it("advances from Alert to Shadow with signoff", () => {
            const state = createDecomState(1, false);
            const { newState, completed } = advanceStage(state, true);
            expect(newState.stage).toBe(1);
            expect(completed).toBe(false);
            expect(newState.history).toHaveLength(3);
            expect(newState.history[1].action).toContain("Alert signed off");
            expect(newState.history[2].action).toContain("Shadow stage initiated");
        });
        it("advances through all stages to completion", () => {
            let state = createDecomState(1, false);
            const r1 = advanceStage(state, true);
            expect(r1.newState.stage).toBe(1);
            const r2 = advanceStage(r1.newState, true);
            expect(r2.newState.stage).toBe(2);
            const r3 = advanceStage(r2.newState, true);
            expect(r3.newState.stage).toBe(3);
            const r4 = advanceStage(r3.newState, true);
            expect(r4.newState.stage).toBe(4);
            expect(r4.completed).toBe(true);
        });
        it("throws if signoff not confirmed", () => {
            const state = createDecomState(1, false);
            expect(() => advanceStage(state, false)).toThrow("Sign-off required");
        });
        it("throws if already at final stage", () => {
            let state = createDecomState(1, false);
            state = advanceStage(state, true).newState; // 1
            state = advanceStage(state, true).newState; // 2
            state = advanceStage(state, true).newState; // 3
            state = advanceStage(state, true).newState; // 4 - completed
            expect(() => advanceStage(state, true)).toThrow("Already at final stage");
        });
    });
    describe("rollbackStage", () => {
        it("rolls back from Shadow to Alert", () => {
            const state = createDecomState(1, false);
            const advanced = advanceStage(state, true).newState;
            const rolledBack = rollbackStage(advanced);
            expect(rolledBack.stage).toBe(0);
            expect(rolledBack.history[rolledBack.history.length - 1].action).toContain("ROLLBACK");
        });
        it("rolls back from Brownout to Shadow", () => {
            let state = createDecomState(1, false);
            state = advanceStage(state, true).newState;
            state = advanceStage(state, true).newState;
            const rolledBack = rollbackStage(state);
            expect(rolledBack.stage).toBe(1);
        });
        it("throws if trying to rollback from Alert", () => {
            const state = createDecomState(1, false);
            expect(() => rollbackStage(state)).toThrow("Cannot rollback from Alert");
        });
        it("throws if trying to rollback from Deregister", () => {
            let state = createDecomState(1, false);
            state = advanceStage(state, true).newState; // 1
            state = advanceStage(state, true).newState; // 2
            state = advanceStage(state, true).newState; // 3
            state = advanceStage(state, true).newState; // 4
            expect(() => rollbackStage(state)).toThrow("IRREVERSIBLE");
        });
    });
    describe("formatDPlus / currentDPlus", () => {
        it("formats D+ correctly from offset", () => {
            const initiatedAt = Date.now() - 86_400_000 * 2;
            const offset = 86_400_000 + 3_600_000 + 30 * 60_000;
            const formatted = formatDPlus(initiatedAt, offset);
            expect(formatted).toBe("D+1 01:30");
        });
        it("formats current D+ correctly", () => {
            const initiatedAt = Date.now() - 86_400_000 * 3;
            const formatted = currentDPlus(initiatedAt);
            expect(formatted).toBe("D+3");
        });
    });
    describe("generateObituaryReport", () => {
        it("generates complete obituary with all sections", () => {
            let state = createDecomState(1, false);
            state = advanceStage(state, true).newState;
            state = advanceStage(state, true).newState;
            state = advanceStage(state, true).newState;
            state = advanceStage(state, true).newState;
            const mockEndpoint = {
                id: 1,
                method: "POST",
                path: "/api/v1/legacy/payment/refund",
                service: "payment-svc",
                gateway: "kong",
                deployedOn: "k8s-prod-01",
                state: "zombie",
                ri: 2.65,
                riBand: "Critical",
                s: 0.9,
                e: 1.0,
                v: 1.75,
                a: 1,
                lastTraffic: "2d ago",
                lastCommit: "1mo ago",
                owner: "mobile-team",
                ownerActive: true,
                pci: true,
                auth: "none",
                tls: "1.1",
                rateLimited: false,
                wafCoverage: false,
                mtls: false,
                apiKeyExposed: true,
                egressVal: false,
            };
            const report = generateObituaryReport(1, mockEndpoint, state);
            expect(report).toContain("API OBITUARY REPORT");
            expect(report).toContain("/api/v1/legacy/payment/refund");
            expect(report).toContain("POST");
            expect(report).toContain("payment-svc");
            expect(report).toContain("RI at Decommission: 2.65");
            expect(report).toContain("DECOMMISSION PIPELINE LOG");
            expect(report).toContain("APPROVING OFFICERS");
            expect(report).toContain("DAST VERIFICATION");
            expect(report).toContain("COMPLIANCE NOTES");
            expect(report).toContain("RBI CSF");
            expect(report).toContain("PCI-DSS");
            expect(report).toContain("GDPR");
        });
    });
    describe("STAGES configuration", () => {
        it("has 5 stages in correct order", () => {
            expect(STAGES).toHaveLength(5);
            expect(STAGES[0].name).toBe("Alert");
            expect(STAGES[1].name).toBe("Shadow");
            expect(STAGES[2].name).toBe("Brownout");
            expect(STAGES[3].name).toBe("Tombstone");
            expect(STAGES[4].name).toBe("Deregister");
        });
        it("each stage has required fields", () => {
            STAGES.forEach((stage) => {
                expect(stage.name).toBeTruthy();
                expect(stage.icon).toBeTruthy();
                expect(stage.signoff).toBeTruthy();
                expect(stage.desc).toBeTruthy();
                expect(stage.rollback).toBeTruthy();
            });
        });
        it("final stage rollback is IRREVERSIBLE", () => {
            expect(STAGES[4].rollback).toContain("IRREVERSIBLE");
        });
    });
});
//# sourceMappingURL=decommission.test.js.map