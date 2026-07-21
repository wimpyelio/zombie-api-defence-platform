import type { ComplianceMapping } from "./types";
/**
 * Compliance Mapping - Platform capabilities to regulatory controls
 *
 * Automated evidence generation for:
 * - RBI Cyber Security Framework
 * - PCI-DSS v4.0
 * - GDPR Article 32
 */
export declare const COMPLIANCE_MAPPINGS: ComplianceMapping[];
export declare function getComplianceByRegulation(regulation: string): ComplianceMapping[];
export declare function getComplianceStats(): Record<string, {
    auto: number;
    partial: number;
    manual: number;
    total: number;
}>;
export declare function generateComplianceReport(): string;
//# sourceMappingURL=compliance.d.ts.map