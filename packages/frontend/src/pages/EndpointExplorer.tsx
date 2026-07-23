import React from 'react';
import { Search, Download, RefreshCw, Zap, Eye, AlertTriangle, Skull, ChevronDown, Info, ExternalLink, BarChart2, HelpCircle, ChevronUp as ChevronUpIcon, ChevronDown as ChevronDownIcon } from 'lucide-react';

const MOCK_ENDPOINTS = Array.from({ length: 50 }, (_, i) => {
  const states = ['active', 'deprecated', 'orphaned', 'zombie'] as const;
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const services = ['payment-api', 'auth-service', 'user-service', 'order-service', 'notification-service', 'inventory-api', 'shipping-api', 'analytics-service'];
  
  const state = states[Math.floor(Math.random() * states.length)];
  const ri = state === 'zombie' ? 2.5 + Math.random() * 2 : 
             state === 'orphaned' ? 1 + Math.random() * 1.5 :
             state === 'deprecated' ? 0.3 + Math.random() * 0.7 :
             Math.random() * 0.5;
 
  return {
    id: i + 1,
    method: methods[Math.floor(Math.random() * methods.length)],
    path: `/api/v${Math.floor(Math.random() * 3) + 1}/${services[Math.floor(Math.random() * services.length)].replace('-api', '').replace('-service', '')}/${['users', 'orders', 'payments', 'tokens', 'events', 'items', 'shipments'][Math.floor(Math.random() * 7)]}/${Math.random() > 0.5 ? '{id}' : ''}`,
    service: services[Math.floor(Math.random() * services.length)],
    state,
    ri: parseFloat(ri.toFixed(2)),
    s: parseFloat((0.2 + Math.random() * 0.8).toFixed(2)),
    e: parseFloat((0.1 + Math.random() * 0.9).toFixed(2)),
    v: parseFloat((0.1 + Math.random() * 0.8).toFixed(2)),
    a: Math.floor(Math.random() * 36),
    pci: Math.random() > 0.7,
    owner: `team-${['payments', 'auth', 'platform', 'data', 'core'][Math.floor(Math.random() * 5)]}`,
    ownerActive: Math.random() > 0.3,
    trafficTrend: ['growing', 'stable', 'declining', 'stale', 'dead'][Math.floor(Math.random() * 5)] as any,
    lastTraffic: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    gateway: ['apigee', 'kong', 'aws_apigw', 'internal', 'none'][Math.floor(Math.random() * 5)] as any,
    auth: ['none', 'api_key', 'jwt', 'oauth2', 'mtls'][Math.floor(Math.random() * 5)] as any,
    tls: ['1.0', '1.1', '1.2', '1.3'][Math.floor(Math.random() * 4)] as any,
    rateLimited: Math.random() > 0.5,
    wafCoverage: Math.random() > 0.5,
    mtls: Math.random() > 0.7,
    egressVal: Math.random() > 0.6,
    sunsetHeader: Math.random() > 0.8 ? '2024-01-15' : '',
    lastCommit: `${Math.floor(Math.random() * 36)}mo ago`,
    decayProb: parseFloat(Math.random().toFixed(2)),
    deployedOn: ['k8s-prod-01', 'k8s-prod-02', 'eks-prod', 'gke-prod'][Math.floor(Math.random() * 4)],
    calledBy: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => j + 1),
    calls: Array.from({ length: Math.floor(Math.random() * 3) }, (_, j) => j + 100),
  };
});

const stateConfig = {
  active: { label: 'Active', color: 'var(--color-active)', bg: 'var(--color-active-bg)', icon: Zap, badge: 'badge-active' },
  deprecated: { label: 'Deprecated', color: 'var(--color-deprecated)', bg: 'var(--color-deprecated-bg)', icon: Eye, badge: 'badge-deprecated' },
  orphaned: { label: 'Orphaned', color: 'var(--color-orphaned)', bg: 'var(--color-orphaned-bg)', icon: AlertTriangle, badge: 'badge-orphaned' },
  zombie: { label: 'Zombie', color: 'var(--color-zombie)', bg: 'var(--color-zombie-bg)', icon: Skull, badge: 'badge-zombie' },
};

const riskBands = [
  { label: 'Critical', min: 2.5, max: Infinity, color: 'var(--color-critical)', bg: 'var(--color-critical-bg)', badge: 'badge-critical' },
  { label: 'High', min: 1.5, max: 2.5, color: 'var(--color-high)', bg: 'var(--color-high-bg)', badge: 'badge-high' },
  { label: 'Medium', min: 0.5, max: 1.5, color: 'var(--color-medium)', bg: 'var(--color-medium-bg)', badge: 'badge-medium' },
  { label: 'Low', min: 0, max: 0.5, color: 'var(--color-low)', bg: 'var(--color-low-bg)', badge: 'badge-low' },
];

function EndpointRow({ endpoint, onClick }: { endpoint: typeof MOCK_ENDPOINTS[0]; onClick: () => void }) {
  const config = stateConfig[endpoint.state];
  const StateIcon = config.icon;
  const band = riskBands.find(b => endpoint.ri >= b.min && endpoint.ri < b.max)!;

  return (
    <tr className="endpoint-row" onClick={onClick}>
      <td className="col-method">
        <span className="method-badge">{endpoint.method}</span>
      </td>
      <td className="col-path">
        <div className="endpoint-path">
          <code>{endpoint.path}</code>
          <span className="endpoint-service">{endpoint.service}</span>
        </div>
      </td>
      <td className="col-state">
        <span className={`badge ${config.badge} state-badge`}>
          <StateIcon size={10} /> {config.label}
        </span>
      </td>
      <td className="col-ri">
        <div className="ri-value" style={{ color: band.color }}>
          {endpoint.ri.toFixed(2)}
        </div>
        <div className="risk-meter-sm">
          <div className="risk-meter-fill-sm" style={{ width: `${Math.min(endpoint.ri / 3 * 100, 100)}%`, background: band.color }} />
        </div>
      </td>
      <td className="col-sev">
        <div className="sev-bars">
          <div className="sev-bar" style={{ width: `${endpoint.s * 100}%`, background: 'var(--color-brand)' }} title={`Sensitivity: ${endpoint.s}`} />
          <div className="sev-bar" style={{ width: `${endpoint.e * 100}%`, background: 'var(--color-high)' }} title={`Exposure: ${endpoint.e}`} />
          <div className="sev-bar" style={{ width: `${endpoint.v * 100}%`, background: 'var(--color-critical)' }} title={`Vulnerability: ${endpoint.v}`} />
        </div>
      </td>
      <td className="col-age">{endpoint.a}mo</td>
      <td className="col-pci">{endpoint.pci ? <span className="pci-badge">PCI</span> : '—'}</td>
      <td className="col-owner">
        <span className={endpoint.ownerActive ? '' : 'owner-inactive'}>{endpoint.owner}</span>
      </td>
      <td className="col-actions">
        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          <Info size={14} />
        </button>
      </td>
    </tr>
  );
}

function EndpointDetailModal({ endpoint, onClose }: { endpoint: typeof MOCK_ENDPOINTS[0] | null; onClose: () => void }) {
  if (!endpoint) return null;

  const config = stateConfig[endpoint.state];
  const StateIcon = config.icon;
  const band = riskBands.find(b => endpoint.ri >= b.min && endpoint.ri < b.max)!;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-endpoint-info">
            <span className="method-badge">{endpoint.method}</span>
            <code>{endpoint.path}</code>
            <span className="endpoint-service">{endpoint.service}</span>
          </div>
          <div className="modal-badges">
            <span className={`badge ${config.badge}`}><StateIcon size={10} /> {config.label}</span>
            <span className={`badge ${band.badge}`}>RI: {endpoint.ri.toFixed(2)} ({band.label})</span>
            {endpoint.pci && <span className="badge badge-critical">PCI Scope</span>}
          </div>
          <button className="modal-close" onClick={onClose}><ChevronDown size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-section">
              <h3>Risk Breakdown</h3>
              <div className="risk-factors">
                <div className="risk-factor">
                  <div className="risk-factor-label">
                    <span>Sensitivity (S)</span>
                    <span className="risk-factor-value">{endpoint.s.toFixed(2)}</span>
                  </div>
                  <div className="risk-factor-bar"><div style={{ width: `${endpoint.s * 100}%`, background: 'var(--color-brand)' }} /></div>
                </div>
                <div className="risk-factor">
                  <div className="risk-factor-label">
                    <span>Exposure (E)</span>
                    <span className="risk-factor-value">{endpoint.e.toFixed(2)}</span>
                  </div>
                  <div className="risk-factor-bar"><div style={{ width: `${endpoint.e * 100}%`, background: 'var(--color-high)' }} /></div>
                </div>
                <div className="risk-factor">
                  <div className="risk-factor-label">
                    <span>Vulnerability (V)</span>
                    <span className="risk-factor-value">{endpoint.v.toFixed(2)}</span>
                  </div>
                  <div className="risk-factor-bar"><div style={{ width: `${endpoint.v * 100}%`, background: 'var(--color-critical)' }} /></div>
                </div>
                <div className="risk-factor">
                  <div className="risk-factor-label">
                    <span>Age (A)</span>
                    <span className="risk-factor-value">{endpoint.a} months</span>
                  </div>
                  <div className="risk-factor-bar"><div style={{ width: `${Math.min(endpoint.a / 36 * 100, 100)}%`, background: 'var(--color-medium)' }} /></div>
                </div>
              </div>
              <div className="ri-formula">
                RI = (S × E × V) / A = ({endpoint.s.toFixed(2)} × {endpoint.e.toFixed(2)} × {endpoint.v.toFixed(2)}) / {endpoint.a} = <strong>{endpoint.ri.toFixed(2)}</strong>
              </div>
            </div>

            <div className="detail-section">
              <h3>Security Controls</h3>
              <div className="control-grid">
                <ControlRow label="Authentication" value={endpoint.auth} status={endpoint.auth !== 'none' ? 'good' : 'bad'} />
                <ControlRow label="TLS Version" value={endpoint.tls} status={['1.2', '1.3'].includes(endpoint.tls) ? 'good' : 'bad'} />
                <ControlRow label="Rate Limited" value={endpoint.rateLimited ? 'Yes' : 'No'} status={endpoint.rateLimited ? 'good' : 'bad'} />
                <ControlRow label="WAF Coverage" value={endpoint.wafCoverage ? 'Yes' : 'No'} status={endpoint.wafCoverage ? 'good' : 'bad'} />
                <ControlRow label="mTLS" value={endpoint.mtls ? 'Yes' : 'No'} status={endpoint.mtls ? 'good' : 'bad'} />
                <ControlRow label="Egress Validation" value={endpoint.egressVal ? 'Yes' : 'No'} status={endpoint.egressVal ? 'good' : 'bad'} />
              </div>
            </div>

            <div className="detail-section">
              <h3>Ownership & Traffic</h3>
              <div className="info-grid">
                <InfoRow label="Owner" value={endpoint.owner} sub={endpoint.ownerActive ? 'Active' : 'Inactive'} subStatus={endpoint.ownerActive ? 'good' : 'bad'} />
                <InfoRow label="Gateway" value={endpoint.gateway} />
                <InfoRow label="Traffic Trend" value={endpoint.trafficTrend} />
                <InfoRow label="Last Traffic" value={endpoint.lastTraffic} />
                <InfoRow label="PCI Scope" value={endpoint.pci ? 'Yes' : 'No'} sub={endpoint.pci ? 'In Scope' : 'Out of Scope'} subStatus={endpoint.pci ? 'bad' : 'good'} />
                <InfoRow label="Decommissioned" value={endpoint.sunsetHeader ? 'Yes' : 'No'} />
              </div>
            </div>

            <div className="detail-section">
              <h3>Recommended Actions</h3>
              <div className="action-list">
                {endpoint.state === 'zombie' && (
                  <>
                    <ActionItem priority="critical" text="Immediate P0 escalation - RI > 2.5 with PCI scope" />
                    <ActionItem priority="high" text="Initiate decommission pipeline (Stage 1: Alert)" />
                    <ActionItem priority="high" text="Enable shadow traffic mirroring for caller inventory" />
                  </>
                )}
                {endpoint.state === 'orphaned' && (
                  <>
                    <ActionItem priority="high" text="Assign new owner or initiate decommission" />
                    <ActionItem priority="medium" text="Enable rate limiting (5% brownout)" />
                  </>
                )}
                {endpoint.state === 'deprecated' && (
                  <>
                    <ActionItem priority="medium" text="Verify sunset headers are being returned" />
                    <ActionItem priority="low" text="Plan migration timeline for callers" />
                  </>
                )}
                {endpoint.state === 'active' && endpoint.ri > 1 && (
                  <ActionItem priority="medium" text="Review security controls - vulnerability score elevated" />
                )}
                {endpoint.auth === 'none' && <ActionItem priority="high" text="Implement authentication (API key, JWT, or mTLS)" />}
                {['1.0', '1.1'].includes(endpoint.tls) && <ActionItem priority="high" text="Upgrade TLS to 1.2 or 1.3" />}
                {!endpoint.rateLimited && <ActionItem priority="medium" text="Enable rate limiting at gateway" />}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}><ExternalLink size={14} /> View in Service Catalog</button>
          <button className="btn btn-primary" onClick={onClose}><BarChart2 size={14} /> Open in Decommission Tracker</button>
        </div>
      </div>
    </div>
  );
}

function ControlRow({ label, value, status }: { label: string; value: string; status: 'good' | 'bad' }) {
  return (
    <div className="control-row">
      <span className="control-label">{label}</span>
      <span className={`control-value ${status}`}>
        <span className={`control-dot ${status}`} /> {value}
      </span>
    </div>
  );
}

function InfoRow({ label, value, sub, subStatus }: { label: string; value: string; sub?: string; subStatus?: 'good' | 'bad' }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <div className="info-value">
        <span>{value}</span>
        {sub && <span className={`info-sub ${subStatus}`}>{sub}</span>}
      </div>
    </div>
  );
}

function ActionItem({ priority, text }: { priority: 'critical' | 'high' | 'medium' | 'low'; text: string }) {
  const priorityStyles = {
    critical: { color: 'var(--color-critical)', bg: 'var(--color-critical-bg)', label: 'P0' },
    high: { color: 'var(--color-high)', bg: 'var(--color-high-bg)', label: 'P1' },
    medium: { color: 'var(--color-medium)', bg: 'var(--color-medium-bg)', label: 'P2' },
    low: { color: 'var(--color-low)', bg: 'var(--color-low-bg)', label: 'P3' },
  };
  const style = priorityStyles[priority];
  
  return (
    <div className="action-item">
      <span className="action-priority" style={{ background: style.bg, color: style.color }}>{style.label}</span>
      <span className="action-text">{text}</span>
    </div>
  );
}

export function EndpointExplorer() {
  const [search, setSearch] = React.useState('');
  const [stateFilter, setStateFilter] = React.useState<string[]>([]);
  const [riskFilter, setRiskFilter] = React.useState<string[]>([]);
  const [pciOnly, setPciOnly] = React.useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = React.useState<typeof MOCK_ENDPOINTS[0] | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'ri', direction: 'desc' });

  const filteredEndpoints = MOCK_ENDPOINTS
    .filter(ep => {
      if (search && !ep.path.toLowerCase().includes(search.toLowerCase()) && !ep.service.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter.length && !stateFilter.includes(ep.state)) return false;
      if (riskFilter.length) {
        const band = riskBands.find(b => ep.ri >= b.min && ep.ri < b.max)!.label.toLowerCase();
        if (!riskFilter.includes(band)) return false;
      }
      if (pciOnly && !ep.pci) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortConfig.key as keyof typeof a];
      const bVal = b[sortConfig.key as keyof typeof b];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const stateCounts = ['active', 'deprecated', 'orphaned', 'zombie'].map(s => ({
    state: s,
    count: MOCK_ENDPOINTS.filter(e => e.state === s).length,
  }));

  const riskCounts = riskBands.map(b => ({
    band: b.label.toLowerCase(),
    count: MOCK_ENDPOINTS.filter(e => e.ri >= b.min && e.ri < b.max).length,
  }));

  return (
    <div className="endpoint-explorer">
      <header className="page-header animate-fade-in">
        <div>
          <h1 className="page-title">Endpoint Explorer</h1>
          <p className="page-description">Discover, filter, and analyze all API endpoints in your inventory</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary"><Download size={16} /> Export CSV</button>
          <button className="btn btn-primary"><RefreshCw size={16} /> Refresh Inventory</button>
        </div>
      </header>

      <div className="filter-bar card animate-slide-in">
        <div className="filter-search">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search endpoints by path, service..." 
            className="input search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          <FilterChipGroup 
            label="State" 
            options={stateCounts.map(s => ({ value: s.state, label: stateConfig[s.state as keyof typeof stateConfig].label, count: s.count }))}
            selected={stateFilter}
            onChange={setStateFilter}
            colors={stateCounts.map(s => stateConfig[s.state as keyof typeof stateConfig].color)}
          />
          <FilterChipGroup 
            label="Risk" 
            options={riskCounts.map(r => ({ value: r.band, label: riskBands.find(b => b.label.toLowerCase() === r.band)!.label, count: r.count }))}
            selected={riskFilter}
            onChange={setRiskFilter}
            colors={riskCounts.map(r => riskBands.find(b => b.label.toLowerCase() === r.band)!.color)}
          />
          <label className="filter-toggle">
            <input 
              type="checkbox" 
              checked={pciOnly} 
              onChange={e => setPciOnly(e.target.checked)} 
            />
            <span>PCI Only</span>
          </label>
        </div>
      </div>

      <div className="results-summary animate-fade-in" style={{ animationDelay: '100ms' }}>
        <span>{filteredEndpoints.length} of {MOCK_ENDPOINTS.length} endpoints</span>
        <Select 
          value={`${sortConfig.key}:${sortConfig.direction}`} 
          onChange={e => {
            const [key, dir] = e.target.value.split(':');
            setSortConfig({ key, direction: dir as 'asc' | 'desc' });
          }}
          options={[
            { value: 'ri:desc', label: 'Risk Index ↓' },
            { value: 'ri:asc', label: 'Risk Index ↑' },
            { value: 'a:desc', label: 'Age (newest)' },
            { value: 'a:asc', label: 'Age (oldest)' },
            { value: 'path:asc', label: 'Path (A-Z)' },
            { value: 'service:asc', label: 'Service (A-Z)' },
          ]}
        />
      </div>

      <div className="card table-card animate-slide-in" style={{ animationDelay: '150ms' }}>
        <div className="table-container">
          <table className="endpoint-table" role="grid">
            <thead>
              <tr>
                <th scope="col" className="col-method" onClick={() => handleSort('method')}>
                  <SortableHeader label="Method" key="method" sortConfig={sortConfig} />
                </th>
                <th scope="col" className="col-path" onClick={() => handleSort('path')}>
                  <SortableHeader label="Endpoint" key="path" sortConfig={sortConfig} />
                </th>
                <th scope="col" className="col-state" onClick={() => handleSort('state')}>
                  <SortableHeader label="State" key="state" sortConfig={sortConfig} />
                </th>
                <th scope="col" className="col-ri" onClick={() => handleSort('ri')}>
                  <SortableHeader label="Risk Index" key="ri" sortConfig={sortConfig} />
                </th>
                <th scope="col" className="col-sev">
                  <span className="sev-header" title="Sensitivity • Exposure • Vulnerability">
                    <HelpCircle size={12} /> S·E·V
                  </span>
                </th>
                <th scope="col" className="col-age" onClick={() => handleSort('a')}>
                  <SortableHeader label="Age" key="a" sortConfig={sortConfig} />
                </th>
                <th scope="col" className="col-pci">PCI</th>
                <th scope="col" className="col-owner" onClick={() => handleSort('owner')}>
                  <SortableHeader label="Owner" key="owner" sortConfig={sortConfig} />
                </th>
                <th scope="col" className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-state-row">
                    <div className="empty-state">
                      <Search size={48} className="empty-icon" />
                      <h3>No endpoints match your filters</h3>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map(ep => (
                  <EndpointRow key={ep.id} endpoint={ep} onClick={() => setSelectedEndpoint(ep)} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EndpointDetailModal endpoint={selectedEndpoint} onClose={() => setSelectedEndpoint(null)} />
    </div>
  );
}

function SortableHeader({ label, key, sortConfig }: { label: string; key: string; sortConfig: { key: string; direction: 'asc' | 'desc' } }) {
  const isActive = sortConfig.key === key;
  return (
    <span className="sortable-header">
      {label}
      {isActive && (sortConfig.direction === 'asc' ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />)}
    </span>
  );
}

function FilterChipGroup({ label, options, selected, onChange, colors }: { 
  label: string; 
  options: Array<{ value: string; label: string; count: number }>;
  selected: string[];
  onChange: (values: string[]) => void;
  colors: string[];
}) {
  return (
    <div className="filter-chip-group">
      <span className="filter-chip-label">{label}</span>
      <div className="filter-chips">
        {options.map((opt, i) => (
          <button
                      key={opt.value}
                      className={`filter-chip ${selected.includes(opt.value) ? 'active' : ''}`}
                      style={{ '--chip-color': colors[i] } as React.CSSProperties}
                      onClick={() => onChange(selected.includes(opt.value)
                        ? selected.filter(v => v !== opt.value)
                        : [...selected, opt.value]
                      )}
                    >
            <span className="chip-dot" />
            {opt.label}
            <span className="chip-count">{opt.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <select className="select select-sm" value={value} onChange={onChange}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}