/**
 * @zad/core - Type Definitions
 *
 * All domain types for the Zombie API Defence Platform.
 * These are the contracts between packages - no implementation details here.
 */
export const DEFAULT_VULN_WEIGHTS = {
    noAuth: 0.35,
    noMTLS: 0.25,
    noRate: 0.20,
    weakTLS: 0.15,
    expKey: 0.40,
    noWAF: 0.30,
    noEgress: 0.10,
};
// ============================================================================
// DECOMMISSION STATE MACHINE
// ============================================================================
export const DAY_MS = 86_400_000;
export const STAGES = [
    {
        name: "Alert",
        icon: "🚨",
        signoff: "BU Head acknowledgement",
        desc: "Auto-generate ServiceNow INC to last known owning BU. Include endpoint, gateway, RI score, 90-day traffic chart, dependency graph, PCI/PII flags, deprovisioned owner. Hard 14-calendar-day response deadline. If no response: escalate to CTO and CISO.",
        rollback: "Close ticket, mark endpoint \"Under Review\", halt pipeline. Zero production impact.",
    },
    {
        name: "Shadow",
        icon: "👁️",
        signoff: "Security Architect sign-off",
        desc: "Deploy Istio VirtualService mirror (or Kong request-transformer). Route 100% of live traffic to sandbox namespace. 14-day observation window. Log: caller SPIFFE ID / JWT sub, payload schema hash, response codes, latency. Build caller inventory.",
        rollback: "Remove VirtualService mirror rule. Effective in <5s. Zero production impact.",
    },
    {
        name: "Brownout",
        icon: "⚡",
        signoff: "Ops Lead + CISO sign-off",
        desc: "Inject 429 Too Many Requests via gateway rate-limit policy. Day 1–3: 5%, Day 4–7: 20%, Day 8–14: 50%. Each rejection logs blocked caller SPIFFE ID. Configurable exception list for explicitly approved callers.",
        rollback: "Remove rate-limit policy from gateway. Effective in <30s.",
    },
    {
        name: "Tombstone",
        icon: "🪦",
        signoff: "CISO sign-off",
        desc: "Replace gateway route with tombstone service returning HTTP 410 Gone: {status, endpoint, decommission_date, contact, ticket}. Log every caller: SPIFFE ID, timestamp, request signature. Maintain 21 days.",
        rollback: "Restore original gateway route from CI/CD backup manifest.",
    },
    {
        name: "Deregister",
        icon: "💀",
        signoff: "CISO + VP Engineering — dual sign-off required",
        desc: "Remove gateway route, scale K8s deployment to 0, remove DNS A-record, update firewall rules. Run DAST probe from all network zones (must return 404). Update ontology to DECOMMISSIONED. Generate cryptographically signed API Obituary Report.",
        rollback: "IRREVERSIBLE. Explicit dual sign-off before this stage. No automated rollback.",
    },
];
export const STATE_COLORS = {
    zombie: "#ff1744",
    orphaned: "#e55a00",
    deprecated: "#f5a623",
    active: "#00e5a0",
    team: "#7b5ea7",
    pci: "#1a3a1a",
};
//# sourceMappingURL=types.js.map