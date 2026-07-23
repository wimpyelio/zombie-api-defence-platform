import React from 'react';
import { 
  ShieldCheck, FileText, CheckCircle, AlertCircle, Clock, 
  Download, RefreshCw, Award, Users, Lock, Globe,
  ChevronLeft
} from 'lucide-react';

const COMPLIANCE_FRAMEWORKS = [
  {
    id: 'pci-dss',
    name: 'PCI-DSS v4.0',
    description: 'Payment Card Industry Data Security Standard',
    icon: Lock,
    color: 'var(--color-brand)',
    bg: 'var(--color-brand-light)',
    score: 94,
    status: 'compliant' as const,
    controls: 12,
    passed: 11,
    lastAudit: '2025-01-15',
    nextAudit: '2025-07-15',
    keyRequirements: [
      { id: 'req-1', title: 'Install and maintain network security controls', status: 'passed', auto: true },
      { id: 'req-2', title: 'Apply secure configurations to all system components', status: 'passed', auto: true },
      { id: 'req-3', title: 'Protect stored account data', status: 'passed', auto: false },
      { id: 'req-4', title: 'Protect cardholder data with strong cryptography', status: 'passed', auto: true },
      { id: 'req-5', title: 'Protect all systems and networks from malicious software', status: 'passed', auto: true },
      { id: 'req-6', title: 'Develop and maintain secure systems and software', status: 'passed', auto: false },
      { id: 'req-7', title: 'Restrict access to system components and cardholder data', status: 'passed', auto: true },
      { id: 'req-8', title: 'Identify users and authenticate access to system components', status: 'partial', auto: false },
      { id: 'req-9', title: 'Restrict physical access to cardholder data', status: 'passed', auto: false },
      { id: 'req-10', title: 'Log and monitor all access to system components', status: 'passed', auto: true },
      { id: 'req-11', title: 'Test security of systems and networks regularly', status: 'passed', auto: true },
      { id: 'req-12', title: 'Support information security with organizational policies', status: 'passed', auto: false },
    ],
  },
  {
    id: 'sox',
    name: 'SOX (Sarbanes-Oxley)',
    description: 'Financial reporting and internal controls',
    icon: FileText,
    color: 'var(--color-high)',
    bg: 'var(--color-high-bg)',
    score: 87,
    status: 'partial' as const,
    controls: 8,
    passed: 7,
    lastAudit: '2025-02-01',
    nextAudit: '2025-08-01',
    keyRequirements: [
      { id: 'sox-1', title: 'Internal controls over financial reporting', status: 'passed', auto: false },
      { id: 'sox-2', title: 'CEO/CFO certification of financial statements', status: 'passed', auto: false },
      { id: 'sox-3', title: 'Audit committee independence', status: 'passed', auto: false },
      { id: 'sox-4', title: 'Internal audit function', status: 'passed', auto: false },
      { id: 'sox-5', title: 'Whistleblower protection', status: 'passed', auto: false },
      { id: 'sox-6', title: 'Document retention policies', status: 'partial', auto: false },
      { id: 'sox-7', title: 'IT general controls (ITGC)', status: 'passed', auto: true },
      { id: 'sox-8', title: 'Change management controls', status: 'passed', auto: true },
    ],
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'General Data Protection Regulation (EU)',
    icon: Globe,
    color: 'var(--color-medium)',
    bg: 'var(--color-medium-bg)',
    score: 91,
    status: 'compliant' as const,
    controls: 10,
    passed: 9,
    lastAudit: '2024-12-10',
    nextAudit: '2025-06-10',
    keyRequirements: [
      { id: 'gdpr-1', title: 'Lawful basis for processing', status: 'passed', auto: false },
      { id: 'gdpr-2', title: 'Data subject rights (access, rectification, erasure)', status: 'passed', auto: true },
      { id: 'gdpr-3', title: 'Data protection by design and by default', status: 'passed', auto: false },
      { id: 'gdpr-4', title: 'Data protection impact assessments (DPIA)', status: 'passed', auto: false },
      { id: 'gdpr-5', title: 'Data breach notification (72 hours)', status: 'passed', auto: true },
      { id: 'gdpr-6', title: 'Data processing agreements with processors', status: 'passed', auto: false },
      { id: 'gdpr-7', title: 'International transfer safeguards', status: 'passed', auto: false },
      { id: 'gdpr-8', title: 'Records of processing activities (ROPA)', status: 'passed', auto: true },
      { id: 'gdpr-9', title: 'Data Protection Officer appointment', status: 'passed', auto: false },
      { id: 'gdpr-10', title: 'Privacy notices and transparency', status: 'partial', auto: false },
    ],
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
    icon: Users,
    color: 'var(--color-low)',
    bg: 'var(--color-low-bg)',
    score: 96,
    status: 'compliant' as const,
    controls: 6,
    passed: 6,
    lastAudit: '2025-03-01',
    nextAudit: '2025-09-01',
    keyRequirements: [
      { id: 'hipaa-1', title: 'Administrative safeguards', status: 'passed', auto: false },
      { id: 'hipaa-2', title: 'Physical safeguards', status: 'passed', auto: false },
      { id: 'hipaa-3', title: 'Technical safeguards', status: 'passed', auto: true },
      { id: 'hipaa-4', title: 'Breach notification rule', status: 'passed', auto: true },
      { id: 'hipaa-5', title: 'Business associate agreements', status: 'passed', auto: false },
      { id: 'hipaa-6', title: 'Minimum necessary standard', status: 'passed', auto: false },
    ],
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    description: 'Information Security Management System',
    icon: Award,
    color: 'var(--color-brand)',
    bg: 'var(--color-brand-light)',
    score: 82,
    status: 'partial' as const,
    controls: 14,
    passed: 11,
    lastAudit: '2024-11-20',
    nextAudit: '2025-05-20',
    keyRequirements: [
      { id: 'iso-1', title: 'Information security policies', status: 'passed', auto: false },
      { id: 'iso-2', title: 'Organization of information security', status: 'passed', auto: false },
      { id: 'iso-3', title: 'Human resource security', status: 'passed', auto: false },
      { id: 'iso-4', title: 'Asset management', status: 'passed', auto: true },
      { id: 'iso-5', title: 'Access control', status: 'passed', auto: true },
      { id: 'iso-6', title: 'Cryptography', status: 'passed', auto: true },
      { id: 'iso-7', title: 'Physical and environmental security', status: 'passed', auto: false },
      { id: 'iso-8', title: 'Operations security', status: 'partial', auto: true },
      { id: 'iso-9', title: 'Communications security', status: 'passed', auto: true },
      { id: 'iso-10', title: 'System acquisition, development and maintenance', status: 'partial', auto: false },
      { id: 'iso-11', title: 'Supplier relationships', status: 'passed', auto: false },
      { id: 'iso-12', title: 'Information security incident management', status: 'passed', auto: true },
      { id: 'iso-13', title: 'Information security aspects of business continuity', status: 'partial', auto: false },
      { id: 'iso-14', title: 'Compliance', status: 'passed', auto: false },
    ],
  },
];

type RequirementStatus = 'passed' | 'partial' | 'failed';

interface Requirement {
  id: string;
  title: string;
  status: RequirementStatus;
  auto: boolean;
}

function FrameworkCard({ framework, onSelect }: { framework: typeof COMPLIANCE_FRAMEWORKS[0]; onSelect: () => void }) {
  const statusStyles = {
    compliant: { badge: 'badge-low', icon: CheckCircle, label: 'Compliant' },
    partial: { badge: 'badge-medium', icon: AlertCircle, label: 'Partial' },
    'non-compliant': { badge: 'badge-critical', icon: AlertCircle, label: 'Non-Compliant' },
  };

  const status = statusStyles[framework.status];
  const StatusIcon = status.icon;

  return (
    <article className="card framework-card clickable" onClick={onSelect}>
      <div className="framework-header">
        <div className="framework-icon" style={{ background: framework.bg, color: framework.color }}>
          <framework.icon size={24} />
        </div>
        <div className="framework-meta">
          <h3 className="framework-name">{framework.name}</h3>
          <p className="framework-desc">{framework.description}</p>
        </div>
        <div className="framework-score" style={{ color: framework.color }}>
          <span className="score-value">{framework.score}%</span>
          <span className={`badge ${status.badge}`}><StatusIcon size={10} /> {status.label}</span>
        </div>
      </div>

      <div className="framework-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${framework.score}%`, background: framework.color }}
          />
        </div>
        <div className="progress-stats">
          <span>{framework.passed} of {framework.controls} controls passed</span>
          <span className="audit-dates">
            <Clock size={12} /> Last: {framework.lastAudit} · Next: {framework.nextAudit}
          </span>
        </div>
      </div>

      <div className="framework-actions">
        <button className="btn btn-ghost btn-sm">View Details</button>
        <button className="btn btn-secondary btn-sm"><Download size={14} /> Export Report</button>
      </div>
    </article>
  );
}

function RequirementRow({ req }: { req: Requirement }) {
  const statusStyles = {
    passed: { icon: CheckCircle, color: 'var(--color-low)', bg: 'var(--color-low-bg)', label: 'Passed' },
    partial: { icon: AlertCircle, color: 'var(--color-medium)', bg: 'var(--color-medium-bg)', label: 'Partial' },
    failed: { icon: AlertCircle, color: 'var(--color-critical)', bg: 'var(--color-critical-bg)', label: 'Failed' },
  };

  const style = statusStyles[req.status];

  return (
    <tr className="requirement-row">
      <td className="req-id"><code>{req.id}</code></td>
      <td className="req-title">{req.title}</td>
      <td className="req-status">
        <span className="badge" style={{ background: style.bg, color: style.color }}>
          <style.icon size={12} /> {style.label}
        </span>
      </td>
      <td className="req-auto">
        {req.auto ? (
          <span className="auto-badge" title="Automated check">
            <ShieldCheck size={12} /> Automated
          </span>
        ) : (
          <span className="manual-badge" title="Manual review required">
            <Users size={12} /> Manual
          </span>
        )}
      </td>
      <td className="req-action">
        <button className="btn btn-ghost btn-sm">Evidence</button>
      </td>
    </tr>
  );
}

export function ComplianceReport() {
  const [selectedFramework, setSelectedFramework] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const framework = selectedFramework ? COMPLIANCE_FRAMEWORKS.find(f => f.id === selectedFramework) : null;

  const overallScore = COMPLIANCE_FRAMEWORKS.reduce((sum, f) => sum + f.score, 0) / COMPLIANCE_FRAMEWORKS.length;
  const totalControls = COMPLIANCE_FRAMEWORKS.reduce((sum, f) => sum + f.controls, 0);
  const passedControls = COMPLIANCE_FRAMEWORKS.reduce((sum, f) => sum + f.passed, 0);

  if (framework) {
    return (
      <div className="compliance-detail animate-fade-in">
        <div className="page-header-detail">
          <button className="btn btn-ghost" onClick={() => setSelectedFramework(null)}>
            <ChevronLeft size={18} /> Back to Frameworks
          </button>
          <div>
            <h1 className="page-title">{framework.name}</h1>
            <p className="page-description">{framework.description}</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary"><Download size={16} /> Export Full Report</button>
            <button className="btn btn-primary"><RefreshCw size={16} /> Re-run Assessment</button>
          </div>
        </div>

        <div className="grid grid-4 gap-6 mb-8">
          <div className="stat-card card">
            <div className="stat-value" style={{ color: framework.color }}>{framework.score}%</div>
            <div className="stat-label">Overall Score</div>
            <div className="stat-trend up">Compliance posture</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{framework.passed} / {framework.controls}</div>
            <div className="stat-label">Controls Passed</div>
            <div className="stat-trend up">Requirements met</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{framework.controls - framework.passed}</div>
            <div className="stat-label">Gaps Remaining</div>
            <div className="stat-trend down">Action required</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">
              <span style={{ color: 'var(--color-low)' }}>{Math.round((framework.passed / framework.controls) * 100)}%</span>
            </div>
            <div className="stat-label">Automation Coverage</div>
            <div className="stat-trend neutral">Automated checks</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="card-title">Control Requirements</h2>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Search requirements..." 
                className="input input-sm" 
                style={{ width: '240px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-container">
              <table className="requirements-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '80px' }}>ID</th>
                    <th scope="col">Requirement</th>
                    <th scope="col" style={{ width: '140px' }}>Status</th>
                    <th scope="col" style={{ width: '140px' }}>Type</th>
                    <th scope="col" style={{ width: '100px' }}>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {framework.keyRequirements
                    .filter(req => 
                      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      req.id.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(req => (
                      <RequirementRow key={req.id} req={req as Requirement} />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-2 gap-6 mt-8">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Evidence Artifacts</h2>
            </div>
            <div className="card-body">
              <div className="evidence-list">
                {framework.keyRequirements
                  .filter(r => r.status === 'passed')
                  .slice(0, 5)
                  .map(req => (
                    <div key={req.id} className="evidence-item">
                      <FileText size={16} className="evidence-icon" />
                      <div className="evidence-info">
                        <span className="evidence-name">{req.id}: {req.title}</span>
                        <span className="evidence-meta">Auto-collected • Last updated: 2025-01-15</span>
                      </div>
                      <button className="btn btn-ghost btn-sm">Download</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Remediation Plan</h2>
            </div>
            <div className="card-body">
              <div className="remediation-list">
                {framework.keyRequirements
                  .filter(r => r.status !== 'passed')
                  .map(req => (
                    <div key={req.id} className="remediation-item">
                      <div className="remediation-info">
                        <span className="remediation-id">{req.id}</span>
                        <span className="remediation-title">{req.title}</span>
                      </div>
                      <div className="remediation-actions">
                        <button className="btn btn-secondary btn-sm">Assign Owner</button>
                        <button className="btn btn-primary btn-sm">Track Progress</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compliance-report">
      <header className="page-header animate-fade-in">
        <div>
          <h1 className="page-title">Compliance Reports</h1>
          <p className="page-description">Regulatory compliance posture across all frameworks</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary"><Download size={16} /> Export All</button>
          <button className="btn btn-primary"><RefreshCw size={16} /> Refresh Assessments</button>
        </div>
      </header>

      <div className="grid grid-4 gap-6 mb-8 animate-slide-in">
        <div className="stat-card card">
          <div className="stat-value" style={{ color: 'var(--color-brand)' }}>{overallScore.toFixed(0)}%</div>
          <div className="stat-label">Overall Compliance</div>
          <div className="stat-trend up">Weighted average</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value" style={{ color: 'var(--color-low)' }}>{passedControls} / {totalControls}</div>
          <div className="stat-label">Controls Passed</div>
          <div className="stat-trend up">Across all frameworks</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value" style={{ color: 'var(--color-medium)' }}>{totalControls - passedControls}</div>
          <div className="stat-label">Open Gaps</div>
          <div className="stat-trend down">Requiring attention</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value" style={{ color: 'var(--color-high)' }}>{COMPLIANCE_FRAMEWORKS.filter(f => f.status === 'partial').length}</div>
          <div className="stat-label">Frameworks Partial</div>
          <div className="stat-trend neutral">Need remediation</div>
        </div>
      </div>

      <div className="grid grid-3 gap-6" aria-label="Compliance frameworks">
        {COMPLIANCE_FRAMEWORKS.map(framework => (
          <FrameworkCard 
            key={framework.id} 
            framework={framework} 
            onSelect={() => setSelectedFramework(framework.id)} 
          />
        ))}
      </div>

      <div className="card mt-8 animate-slide-in" style={{ animationDelay: '200ms' }}>
        <div className="card-header">
          <h2 className="card-title">Upcoming Audit Schedule</h2>
        </div>
        <div className="card-body">
          <div className="audit-timeline">
            {COMPLIANCE_FRAMEWORKS
              .sort((a, b) => new Date(a.nextAudit).getTime() - new Date(b.nextAudit).getTime())
              .map(framework => (
                <div key={framework.id} className="audit-item">
                  <div className="audit-date">
                    <time>{new Date(framework.nextAudit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                  </div>
                  <div className="audit-info">
                    <div className="audit-framework" style={{ color: framework.color }}>
                      <framework.icon size={16} /> {framework.name}
                    </div>
                    <div className="audit-details">
                      <span>Last audit: {framework.lastAudit}</span>
                      <span>Score: {framework.score}%</span>
                      <span className={`badge ${framework.status === 'compliant' ? 'badge-low' : 'badge-medium'}`}>
                        {framework.status}
                      </span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm">Prepare</button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}