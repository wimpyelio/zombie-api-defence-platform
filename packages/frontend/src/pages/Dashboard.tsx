import { 
  Server, AlertTriangle, TrendingUp, TrendingDown, ShieldCheck, 
  Archive, Zap, Eye, Skull, 
  Lock, FileText, Globe, Users 
} from 'lucide-react';

function StatCard({ title, value, description, trend, icon, color, href }: any) {
  return (
    <article className={`card stat-card animate-fade-in ${href ? 'clickable' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value" style={{ color: `var(--color-${color})` }}>{value}</p>
          <p className="stat-description">{description}</p>
        </div>
        <div className="stat-icon" style={{ background: `var(--color-${color}-light, var(--color-${color}-bg))`, color: `var(--color-${color})` }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`stat-trend ${trend.direction}`}>
          {trend.direction === 'up' && <TrendingUp size={12} />}
          {trend.direction === 'down' && <TrendingDown size={12} />}
          {trend.direction === 'neutral' && <span>→</span>}
          <span>{trend.value}</span>
        </div>
      )}
    </article>
  );
}

function RiskBreakdown({ label, value, color, bgColor, borderColor, count }: any) {
  return (
    <div className="risk-breakdown-item">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-mono tabular-nums" style={{ color }}>{value}%</span>
      </div>
      <div className="risk-meter" style={{ marginTop: 'var(--space-2)' }}>
        <div className="risk-meter-fill" style={{ width: `${value}%`, background: color, borderColor: color }} />
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 'var(--space-1)' }}>
        <span className="text-xs text-muted">{count} endpoints</span>
        <span className="badge" style={{ background: bgColor, color, borderColor }}>Band</span>
      </div>
    </div>
  );
}

function RecentActivity({ activities }: { activities: Array<{ id: string; type: string; title: string; description: string; timestamp: string; status: string }> }) {
  const statusStyles: Record<string, string> = {
    completed: 'badge-low',
    in_progress: 'badge-brand',
    pending: 'badge-medium',
    failed: 'badge-critical',
  };

  const typeIcons: Record<string, React.ReactElement> = {
    scan: <Server size={14} />,
    decommission: <Archive size={14} />,
    alert: <AlertTriangle size={14} />,
    compliance: <ShieldCheck size={14} />,
  };

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <a href="#" className="text-sm text-brand">View all</a>
      </div>
      <div className="card-body p-0">
        <div className="activity-list">
          {activities.map((activity: any) => (
            <div key={activity.id} className="activity-item flex items-start gap-4 p-4 border-b border-border last:border-0 hover:bg-bg transition-colors">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" 
                   style={{ background: `var(--color-${activity.type === 'alert' ? 'critical' : 'brand'}-bg)`, color: `var(--color-${activity.type === 'alert' ? 'critical' : 'brand'})` }}>
                {typeIcons[activity.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    <p className="text-xs text-muted mt-0.5">{activity.description}</p>
                  </div>
                  <span className={`badge ${statusStyles[activity.status]} whitespace-nowrap`}>
                    {activity.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <time className="text-xs text-subtle">{activity.timestamp}</time>
                  <span className="text-xs text-subtle">•</span>
                  <span className="text-xs text-subtle">System</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const stats = [
    { title: 'Total Endpoints', value: '2,847', description: 'Discovered across 47 services', trend: { value: '+12 this week', direction: 'up' as const }, icon: <Server size={24} />, color: 'brand' },
    { title: 'Critical Risk', value: '23', description: 'Endpoints requiring immediate action', trend: { value: '-3 from last scan', direction: 'down' as const }, icon: <AlertTriangle size={24} />, color: 'critical' },
    { title: 'In Decommission', value: '7', description: 'Active decommission pipelines', trend: { value: '2 completed this month', direction: 'up' as const }, icon: <Archive size={24} />, color: 'high' },
    { title: 'Compliance Score', value: '94%', description: 'PCI-DSS, SOX, GDPR coverage', trend: { value: 'Stable', direction: 'neutral' as const }, icon: <ShieldCheck size={24} />, color: 'low' },
  ];

  const riskBandsData = [
    { label: 'Critical (RI > 2.5)', value: 0.8, color: 'var(--color-critical)', bgColor: 'var(--color-critical-bg)', borderColor: 'var(--color-critical-border)', count: 23 },
    { label: 'High (RI 1.5-2.5)', value: 4.2, color: 'var(--color-high)', bgColor: 'var(--color-high-bg)', borderColor: 'var(--color-high-border)', count: 119 },
    { label: 'Medium (RI 0.5-1.5)', value: 18.7, color: 'var(--color-medium)', bgColor: 'var(--color-medium-bg)', borderColor: 'var(--color-medium-border)', count: 532 },
    { label: 'Low (RI < 0.5)', value: 76.3, color: 'var(--color-low)', bgColor: 'var(--color-low-bg)', borderColor: 'var(--color-low-border)', count: 2173 },
  ];

  const lifecycleStates = [
    { label: 'Active', value: 62.4, color: 'var(--color-active)', bgColor: 'var(--color-active-bg)', icon: <Zap size={14} />, count: 1776 },
    { label: 'Deprecated', value: 24.1, color: 'var(--color-deprecated)', bgColor: 'var(--color-deprecated-bg)', icon: <Eye size={14} />, count: 686 },
    { label: 'Orphaned', value: 11.2, color: 'var(--color-orphaned)', bgColor: 'var(--color-orphaned-bg)', icon: <AlertTriangle size={14} />, count: 319 },
    { label: 'Zombie', value: 2.3, color: 'var(--color-zombie)', bgColor: 'var(--color-zombie-bg)', icon: <Skull size={14} />, count: 66 },
  ];

  const activities = [
    { id: '1', type: 'scan', title: 'Full inventory scan completed', description: 'Discovered 2,847 endpoints across 47 services', timestamp: '2 minutes ago', status: 'completed' },
    { id: '2', type: 'decommission', title: 'Payment API v1 decommissioned', description: 'Stage 4 (Tombstone) completed for pay-api/v1/charges', timestamp: '1 hour ago', status: 'completed' },
    { id: '3', type: 'alert', title: 'New zombie endpoint detected', description: 'auth-service/legacy/token (RI: 3.2, PCI scope)', timestamp: '3 hours ago', status: 'pending' },
    { id: '4', type: 'compliance', title: 'PCI-DSS report generated', description: 'Quarterly attestation package ready for Q3 2025', timestamp: 'Yesterday', status: 'completed' },
    { id: '5', type: 'scan', title: 'Incremental scan scheduled', description: 'Next scan in 4 hours - 12 services queued', timestamp: 'Tomorrow 02:00', status: 'pending' },
  ];

  const quickActions = [
    { label: 'Start New Scan', description: 'Discover new endpoints', icon: <Server size={18} />, primary: true },
    { label: 'View Critical Risks', description: '23 endpoints need attention', icon: <AlertTriangle size={18} />, primary: false },
    { label: 'Decommission Pipeline', description: '7 active pipelines', icon: <Archive size={18} />, primary: false },
    { label: 'Export Compliance', description: 'Generate audit package', icon: <ShieldCheck size={18} />, primary: false },
  ];

  return (
    <div className="dashboard">
      <header className="page-header animate-fade-in">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your API security posture and zombie endpoint landscape</p>
      </header>

      <section className="grid grid-4 gap-6 mb-8" aria-label="Key metrics">
        {stats.map((stat, i) => (
          <StatCard key={stat.title} {...stat} style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </section>

      <div className="grid grid-2 lg:grid-cols-[2fr_1fr] gap-6 mb-8">
        <div className="card animate-slide-in">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Risk Index Distribution</h3>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="badge badge-brand">RI = (S × E × V) / A</span>
            </div>
          </div>
          <div className="card-body">
            <div className="risk-breakdown space-y-6">
              {riskBandsData.map((band, i) => (
                <RiskBreakdown key={band.label} {...band} style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
            <div className="mt-6 p-4 bg-bg rounded-lg border border-border">
              <p className="text-sm text-muted">
                <strong>Risk Index (RI)</strong> = (Sensitivity × Exposure × Vulnerability) ÷ Age in months. 
                Higher RI indicates higher probability of being a zombie API. 
                Critical band (RI {'>'} 2.5) triggers automatic P0 escalation.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card animate-slide-in">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Lifecycle States</h3>
            </div>
            <div className="card-body space-y-4">
              {lifecycleStates.map((state, i) => (
                <div key={state.label} className="lifecycle-item" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" 
                           style={{ background: state.bgColor, color: state.color }}>
                        {state.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{state.label}</p>
                        <p className="text-xs text-muted">{state.count} endpoints</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg" style={{ color: state.color }}>{state.value}%</p>
                      <div className="risk-meter" style={{ width: '120px', marginTop: 'var(--space-1)' }}>
                        <div className="risk-meter-fill" style={{ width: `${state.value}%`, background: state.color }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card animate-slide-in">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </div>
            <div className="card-body space-y-3">
              {quickActions.map((action, i) => (
                <button 
                  key={action.label} 
                  className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'} w-full justify-start gap-3`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span style={{ color: action.primary ? 'white' : 'var(--color-brand)' }}>
                    {action.icon}
                  </span>
                  <div className="text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-muted">{action.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2 gap-6">
        <RecentActivity activities={activities} />
        
        <div className="card animate-slide-in" style={{ animationDelay: '150ms' }}>
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Compliance Overview</h3>
            <a href="#" className="text-sm text-brand">View full report</a>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {[
                { name: 'PCI-DSS v4.0', score: 94, status: 'compliant', color: 'var(--color-brand)', icon: Lock },
                { name: 'SOX', score: 87, status: 'partial', color: 'var(--color-high)', icon: FileText },
                { name: 'GDPR', score: 91, status: 'compliant', color: 'var(--color-medium)', icon: Globe },
                { name: 'HIPAA', score: 96, status: 'compliant', color: 'var(--color-low)', icon: Users },
              ].map((comp, i) => (
                <div key={comp.name} className="compliance-row flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-bg)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${comp.color}20`, color: comp.color }}>
                      <comp.icon size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{comp.name}</p>
                      <p className="text-xs text-muted">Last audit: {['2025-01-15', '2025-02-01', '2024-12-10', '2025-03-01'][i]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg" style={{ color: comp.color }}>{comp.score}%</p>
                    <span className={`badge ${comp.status === 'compliant' ? 'badge-low' : 'badge-medium'}`}>
                      {comp.status === 'compliant' ? 'Compliant' : 'Partial'}
                    </span>
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