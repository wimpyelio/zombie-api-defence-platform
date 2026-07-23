import type { ComplianceMapping } from './types.js';

/**
 * Compliance Mapping - Platform capabilities to regulatory controls
 *
 * Automated evidence generation for:
 * - RBI Cyber Security Framework
 * - PCI-DSS v4.0
 * - GDPR Article 32
 */

export const COMPLIANCE_MAPPINGS: ComplianceMapping[] = [
  // RBI Cyber Security Framework
  {
    regulation: 'RBI CSF',
    control: '§6.1 — Asset Inventory',
    capability: 'Continuous API ontology with full lifecycle tracking',
    artefact: 'Living digital twin export, quarterly report',
    status: 'auto',
  },
  {
    regulation: 'RBI CSF',
    control: '§6.4 — Incident Management',
    capability: 'Critical RI auto-response triggers P0 workflow',
    artefact: 'ServiceNow INC records, escalation log',
    status: 'auto',
  },
  {
    regulation: 'RBI CSF',
    control: '§7.2 — Privileged Access',
    capability: 'IAM/LDAP correlation flags orphaned service accounts',
    artefact: 'Ghost endpoint report, deprovisioned identity log',
    status: 'auto',
  },
  {
    regulation: 'RBI CSF',
    control: '§8.3 — Patch Management',
    capability: 'RI age component (V/A) tracks maintenance staleness',
    artefact: 'RI score history with A-component breakdown',
    status: 'auto',
  },

  // PCI-DSS v4.0
  {
    regulation: 'PCI-DSS v4',
    control: 'Req 6.2 — Secure Software Development',
    capability: 'CI/CD gate enforces api-manifest.yaml + ontology registration',
    artefact: 'PR block audit log, manifest compliance rate',
    status: 'auto',
  },
  {
    regulation: 'PCI-DSS v4',
    control: 'Req 6.3 — Vulnerability Identification',
    capability: 'V-composite tracks missing auth, TLS version, rate limiting',
    artefact: 'RI V sub-component breakdown, weekly sweep output',
    status: 'auto',
  },
  {
    regulation: 'PCI-DSS v4',
    control: 'Req 8.2 — User Identification',
    capability: 'Every API has owner attribution; ghost endpoint flagging',
    artefact: 'Owner linkage audit, HRIS/LDAP reconciliation log',
    status: 'auto',
  },
  {
    regulation: 'PCI-DSS v4',
    control: 'Req 8.6 — Service Accounts',
    capability: 'Service account lifecycle cross-referenced with ontology owner',
    artefact: 'Deprovisioned identity → active endpoint cross-reference',
    status: 'partial',
  },

  // GDPR Article 32
  {
    regulation: 'GDPR Art.32',
    control: 'Technical Measures',
    capability: 'NLP PII scanner + circuit breaker for schema drift',
    artefact: 'Sensitivity classification per endpoint, drift event log',
    status: 'auto',
  },
  {
    regulation: 'GDPR Art.32',
    control: 'Encryption Assurance',
    capability: 'TLS version enforced in RI; mTLS coverage tracked per service',
    artefact: 'TLS compliance report, mTLS heat map',
    status: 'auto',
  },
  {
    regulation: 'GDPR Art.32',
    control: 'Ongoing Confidentiality',
    capability: 'Weekly health sweep re-evaluates all PII-classified endpoints',
    artefact: 'Weekly sweep output, PII endpoint state trend',
    status: 'partial',
  },
];

export function getComplianceByRegulation(regulation: string): ComplianceMapping[] {
  return COMPLIANCE_MAPPINGS.filter((m) => m.regulation === regulation);
}

export function getComplianceStats(): Record<
  string,
  { auto: number; partial: number; manual: number; total: number }
> {
  const stats: Record<string, { auto: number; partial: number; manual: number; total: number }> =
    {};

  for (const mapping of COMPLIANCE_MAPPINGS) {
    const reg = mapping.regulation;
    if (!stats[reg]) {
      stats[reg] = { auto: 0, partial: 0, manual: 0, total: 0 };
    }
    const statusKey = mapping.status as keyof (typeof stats)[string];
    stats[reg][statusKey]++;
    stats[reg].total++;
  }

  return stats;
}

export function generateComplianceReport(): string {
  const stats = getComplianceStats();
  const now = new Date().toISOString();

  let report = `================================================================================
COMPLIANCE EVIDENCE REPORT — ZADF Platform
Generated: ${now}
================================================================================

`;

  for (const [regulation, s] of Object.entries(stats)) {
    const pct = Math.round(((s.auto + s.partial * 0.5) / s.total) * 100);
    report += `${regulation} — ${pct}% evidenced (Auto: ${s.auto}, Partial: ${s.partial}, Manual: ${s.manual})\n`;
    report += '─'.repeat(80) + '\n';

    for (const m of COMPLIANCE_MAPPINGS.filter((m) => m.regulation === regulation)) {
      const statusIcon = m.status === 'auto' ? '✓' : m.status === 'partial' ? '◐' : '○';
      report += `  ${statusIcon} ${m.control}\n`;
      report += `      Capability: ${m.capability}\n`;
      report += `      Artefact:   ${m.artefact}\n`;
      report += `      Status:     ${m.status === 'auto' ? 'Automated' : m.status === 'partial' ? 'Partial' : 'Manual'}\n\n`;
    }
  }

  report += `================================================================================
NOTES
- Auto: Fully automated continuous evidence generation
- Partial: Platform provides data; human review/attestation required
- Manual: Platform does not yet address; requires external process
================================================================================`;

  return report;
}
