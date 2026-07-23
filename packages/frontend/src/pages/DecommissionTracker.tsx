import React from 'react';
import { 
  AlertTriangle, Eye, Zap, Skull, Archive, 
  ChevronRight, CheckCircle, XCircle,
  RotateCcw,
  Info, AlertCircle, Shield
} from 'lucide-react';
import { DecomState, STAGES, StageConfig } from '@zad/core';

const stageColors = [
  { bg: 'var(--color-high-bg)', border: 'var(--color-high-border)', text: 'var(--color-high)' },
  { bg: 'var(--color-zombie-bg)', border: 'var(--color-zombie-border)', text: 'var(--color-zombie)' },
  { bg: 'var(--color-critical-bg)', border: 'var(--color-critical-border)', text: 'var(--color-critical)' },
  { bg: 'var(--color-decommissioned-bg)', border: 'var(--color-decommissioned-bg)', text: 'var(--color-decommissioned)' },
];

const stageIcons = [AlertTriangle, Eye, Zap, Skull, Archive];

function StageIcon({ stage, size = 14 }: { stage: number; size?: number }) {
  const Icon = stageIcons[stage];
  return <Icon size={size} />;
}

interface DecommissionRowProps {
  endpoint: {
    id: number;
    method: string;
    path: string;
    service: string;
    state: string;
    ri: number;
    pci: boolean;
    decomState?: DecomState;
    owner: string;
  };
  onAction: (ep: any, action: 'advance' | 'rollback' | 'details' | 'initiate') => void;
}

function DecommissionRow({ endpoint, onAction }: DecommissionRowProps) {
  const decomState = endpoint.decomState;
  const currentStage = decomState?.stage ?? 0;
  const initiatedAt = decomState?.initiatedAt ? new Date(decomState.initiatedAt) : null;
  
  const getDPlus = () => {
    if (!initiatedAt) return '—';
    const diff = Date.now() - initiatedAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days >= 0 ? `D+${days}` : 'Not started';
  };

  const canAdvance = currentStage < 4 && currentStage > 0;
  const canRollback = currentStage > 0;

  return (
    <tr className="decom-row">
      <td className="col-method">
        <code className="method-badge">{endpoint.method}</code>
      </td>
      <td className="col-path">
        <div className="endpoint-path">
          <span className="service-badge">{endpoint.service}</span>
          <code>{endpoint.path}</code>
        </div>
      </td>
      <td className="col-ri">
        <span className="font-mono tabular-nums">{endpoint.ri.toFixed(2)}</span>
        {endpoint.pci && <span className="badge badge-brand">PCI</span>}
      </td>
      <td className="col-stage">
        <div className="stage-progress">
          {STAGES.map((stage, i) => (
            <div key={i} className={`stage-step ${i < currentStage ? 'completed' : ''} ${i === currentStage ? 'current' : ''}`}>
              <div className="stage-dot" style={{ 
                background: i <= currentStage ? stageColors[i].text : 'var(--color-border)',
                borderColor: i <= currentStage ? stageColors[i].text : 'var(--color-border)'
              }}>
                {i <= currentStage && <CheckCircle size={10} color="white" />}
              </div>
              <span className="stage-label">{stage.name}</span>
              {i < 4 && <div className="stage-connector" style={{ background: i < currentStage ? stageColors[i].text : 'var(--color-border)' }} />}
            </div>
          ))}
        </div>
      </td>
      <td className="col-current-stage">
        <div className="current-stage-badge" style={{ background: stageColors[currentStage].bg, color: stageColors[currentStage].text, borderColor: stageColors[currentStage].border }}>
          <StageIcon stage={currentStage} size={14} />
          <span>{STAGES[currentStage].name}</span>
        </div>
        <div className="d-plus">{getDPlus()}</div>
      </td>
      <td className="col-owner">{endpoint.owner}</td>
      <td className="col-actions">
        <div className="action-buttons">
          {currentStage === 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => onAction(endpoint, 'initiate')}>
              <AlertTriangle size={14} /> Initiate
            </button>
          )}
          {canAdvance && (
            <button className="btn btn-secondary btn-sm" onClick={() => onAction(endpoint, 'advance')}>
              <ChevronRight size={14} /> Advance
            </button>
          )}
          {canRollback && currentStage < 4 && (
            <button className="btn btn-ghost btn-sm" onClick={() => onAction(endpoint, 'rollback')}>
              <RotateCcw size={14} /> Rollback
            </button>
          )}
          {currentStage === 4 && (
            <span className="badge badge-decommissioned">
              <Archive size={12} /> Complete
            </span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => onAction(endpoint, 'details')}>
            <Info size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface StageDetailModalProps {
  stage: StageConfig;
  stageIndex: number;
  endpoint: any;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'advance' | 'rollback') => void;
}

function StageDetailModal({ stage, stageIndex, endpoint, isOpen, onClose, onAction }: StageDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="modal-header" style={{ borderColor: stageColors[stageIndex].border }}>
          <div>
            <h2 className="modal-title" style={{ color: stageColors[stageIndex].text }}>
              <StageIcon stage={stageIndex} size={24} /> Stage {stageIndex + 1}: {stage.name}
            </h2>
            <p className="modal-subtitle">{stage.desc}</p>
          </div>
          <button className="btn btn-ghost" onClick={onClose}><XCircle size={24} /></button>
        </div>

        <div className="modal-body">
          <div className="stage-detail-section">
            <h3>Sign-off Required</h3>
            <div className="signoff-badge">
              <Shield size={18} /> {stage.signoff}
            </div>
          </div>

          <div className="stage-detail-section">
            <h3>Rollback Procedure</h3>
            <p className="rollback-text">{stage.rollback}</p>
            <div className="rollback-impact">
              <AlertCircle size={16} /> <strong>Impact:</strong> {stage.rollback.includes('IRREVERSIBLE') ? 'IRREVERSIBLE' : 'Reversible'}
            </div>
          </div>

          <div className="stage-detail-section">
            <h3>Endpoint Details</h3>
            <dl className="detail-list">
              <div><dt>Method</dt><dd><code>{endpoint.method}</code></dd></div>
              <div><dt>Path</dt><dd><code>{endpoint.path}</code></dd></div>
              <div><dt>Service</dt><dd>{endpoint.service}</dd></div>
              <div><dt>Risk Index</dt><dd className="font-mono">{endpoint.ri.toFixed(2)}</dd></div>
              <div><dt>PCI Scope</dt><dd>{endpoint.pci ? 'Yes' : 'No'}</dd></div>
              <div><dt>Owner</dt><dd>{endpoint.owner}</dd></div>
            </dl>
          </div>
        </div>

        <div className="modal-footer">
          {stageIndex > 0 && (
            <button className="btn btn-secondary" onClick={() => onAction('rollback')}>
              <RotateCcw size={16} /> Rollback to Previous Stage
            </button>
          )}
          {stageIndex < 4 && (
            <button className="btn btn-primary" onClick={() => onAction('advance')}>
              Advance to Stage {stageIndex + 2} <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DecommissionTracker() {
  const [selectedEndpoint, setSelectedEndpoint] = React.useState<any>(null);

  const mockEndpoints = React.useMemo(() => [
    { id: 101, method: 'POST', path: '/api/v1/payments/charges', service: 'payments', state: 'zombie', ri: 3.42, pci: true, owner: 'payments-team', decomState: { stage: 1, initiatedAt: Date.now() - 3 * 86400000, history: [] } },
    { id: 102, method: 'GET', path: '/api/v1/users/profile', service: 'auth', state: 'orphaned', ri: 1.87, pci: false, owner: 'identity-team', decomState: { stage: 2, initiatedAt: Date.now() - 7 * 86400000, history: [] } },
    { id: 103, method: 'DELETE', path: '/api/v1/orders/{id}', service: 'orders', state: 'zombie', ri: 2.95, pci: true, owner: 'core-services', decomState: { stage: 3, initiatedAt: Date.now() - 14 * 86400000, history: [] } },
    { id: 104, method: 'GET', path: '/api/v1/reports/monthly', service: 'reporting', state: 'deprecated', ri: 0.42, pci: false, owner: 'analytics-team', decomState: { stage: 0, initiatedAt: 0, history: [] } },
    { id: 105, method: 'POST', path: '/api/v1/billing/invoices', service: 'billing', state: 'zombie', ri: 4.12, pci: true, owner: 'billing-team', decomState: { stage: 4, initiatedAt: Date.now() - 45 * 86400000, history: [] } },
    { id: 106, method: 'GET', path: '/api/v1/tokens/validate', service: 'auth', state: 'orphaned', ri: 2.31, pci: false, owner: 'legacy-owner', decomState: { stage: 1, initiatedAt: Date.now() - 1 * 86400000, history: [] } },
    { id: 107, method: 'PUT', path: '/api/v1/notifications/prefs', service: 'notifications', state: 'zombie', ri: 1.56, pci: false, owner: 'platform-team', decomState: { stage: 0, initiatedAt: 0, history: [] } },
    { id: 108, method: 'POST', path: '/api/v1/analytics/events', service: 'analytics', state: 'zombie', ri: 3.78, pci: true, owner: 'data-team', decomState: { stage: 2, initiatedAt: Date.now() - 10 * 86400000, history: [] } },
  ], []);

  const stats = React.useMemo(() => ({
    total: mockEndpoints.length,
    inProgress: mockEndpoints.filter(e => e.decomState && e.decomState.stage > 0 && e.decomState.stage < 4).length,
    completed: mockEndpoints.filter(e => e.decomState && e.decomState.stage === 4).length,
    notStarted: mockEndpoints.filter(e => !e.decomState || e.decomState.stage === 0).length,
    pciInProgress: mockEndpoints.filter(e => e.pci && e.decomState && e.decomState.stage > 0 && e.decomState.stage < 4).length,
  }), [mockEndpoints]);

  const openModal = (ep: any, action: 'advance' | 'rollback' | 'details' | 'initiate') => {
    if (action === 'details' || action === 'initiate') {
      setSelectedEndpoint(ep);
    } else {
      setSelectedEndpoint(ep);
    }
  };

  return (
    <div className="decommission-tracker">
      <header className="page-header animate-fade-in">
        <div className="page-header-content">
          <div>
            <h1 className="page-title">Decommission Tracker</h1>
            <p className="page-description">Track zombie API decommissioning through the 5-stage safety pipeline</p>
          </div>
        </div>
      </header>

      <div className="stats-grid animate-slide-in">
        <div className="stat-card card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Tracked</div>
          <div className="stat-trend neutral">Endpoints in pipeline</div>
        </div>
        <div className="stat-card card" style={{ borderLeft: '4px solid var(--color-high)' }}>
          <div className="stat-value" style={{ color: 'var(--color-high)' }}>{stats.inProgress}</div>
          <div className="stat-label">In Progress</div>
          <div className="stat-trend up">Active decommissions</div>
        </div>
        <div className="stat-card card" style={{ borderLeft: '4px solid var(--color-critical)' }}>
          <div className="stat-value" style={{ color: 'var(--color-critical)' }}>{stats.pciInProgress}</div>
          <div className="stat-label">PCI In Progress</div>
          <div className="stat-trend up">Require priority review</div>
        </div>
        <div className="stat-card card" style={{ borderLeft: '4px solid var(--color-low)' }}>
          <div className="stat-value" style={{ color: 'var(--color-low)' }}>{stats.completed}</div>
          <div className="stat-label">Completed</div>
          <div className="stat-trend up">Fully decommissioned</div>
        </div>
        <div className="stat-card card" style={{ borderLeft: '4px solid var(--color-deprecated)' }}>
          <div className="stat-value" style={{ color: 'var(--color-deprecated)' }}>{stats.notStarted}</div>
          <div className="stat-label">Not Started</div>
          <div className="stat-trend neutral">Awaiting initiation</div>
        </div>
      </div>

      <div className="card animate-slide-in" style={{ animationDelay: '100ms' }}>
        <div className="card-header">
          <h2 className="card-title">Decommission Pipeline</h2>
          <p className="card-subtitle">Stage progression for all endpoints under decommissioning</p>
        </div>
        <div className="card-body p-0">
          <div className="table-container">
            <table className="decom-table" role="grid">
              <thead>
                <tr>
                  <th scope="col">Method</th>
                  <th scope="col" style={{ width: '280px' }}>Endpoint</th>
                  <th scope="col" style={{ width: '100px' }}>Risk Index</th>
                  <th scope="col" style={{ width: '380px' }}>Pipeline Progress</th>
                  <th scope="col" style={{ width: '160px' }}>Current Stage</th>
                  <th scope="col" style={{ width: '150px' }}>Owner</th>
                  <th scope="col" style={{ width: '180px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockEndpoints.map(ep => (
                  <DecommissionRow key={ep.id} endpoint={ep} onAction={openModal} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <StageDetailModal
        stage={STAGES[selectedEndpoint?.decomState?.stage ?? 0]}
        stageIndex={selectedEndpoint?.decomState?.stage ?? 0}
        endpoint={selectedEndpoint}
        isOpen={!!selectedEndpoint}
        onClose={() => { setSelectedEndpoint(null); }}
        onAction={(action) => {
          if (action === 'advance' && selectedEndpoint.decomState) {
            selectedEndpoint.decomState.stage = Math.min(4, selectedEndpoint.decomState.stage + 1);
          } else if (action === 'rollback' && selectedEndpoint.decomState) {
            selectedEndpoint.decomState.stage = Math.max(0, selectedEndpoint.decomState.stage - 1);
          }
          setSelectedEndpoint({ ...selectedEndpoint });
        }}
      />
    </div>
  );
}