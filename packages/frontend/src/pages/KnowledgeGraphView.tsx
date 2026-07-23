import React from 'react';
import { 
  Download, GitBranch, ExternalLink,
  Users, ShieldCheck, Plus, Minus, ChevronRight, Server, Settings
} from 'lucide-react';

type NodeType = 'api' | 'team' | 'pci';
type EdgeType = 'calls' | 'owns' | 'pci';
type NodeState = 'active' | 'deprecated' | 'orphaned' | 'zombie';

interface MockNode {
  id: number;
  label: string;
  type: NodeType;
  state: NodeState;
  x: number;
  y: number;
  r: number;
  critical?: boolean;
  teamLabel?: string;
  scopeLabel?: string;
}

interface MockEdge {
  s: number;
  t: number;
  type: EdgeType;
}

const MOCK_NODES: MockNode[] = [
  { id: 1, label: 'payments-api', type: 'api', state: 'zombie', x: 200, y: 150, r: 28, critical: true },
  { id: 2, label: 'auth-service', type: 'api', state: 'orphaned', x: 400, y: 100, r: 24 },
  { id: 3, label: 'user-service', type: 'api', state: 'active', x: 600, y: 180, r: 22 },
  { id: 4, label: 'order-service', type: 'api', state: 'active', x: 500, y: 300, r: 22 },
  { id: 5, label: 'notification-api', type: 'api', state: 'deprecated', x: 300, y: 350, r: 20 },
  { id: 6, label: 'inventory-api', type: 'api', state: 'active', x: 700, y: 280, r: 20 },
  { id: 7, label: 'shipping-api', type: 'api', state: 'zombie', x: 550, y: 420, r: 26, critical: true },
  { id: 8, label: 'analytics-service', type: 'api', state: 'active', x: 750, y: 400, r: 18 },
  { id: 9, label: 'payment-team', type: 'team', state: 'active', teamLabel: 'Payments Team', x: 100, y: 100, r: 24 },
  { id: 10, label: 'platform-team', type: 'team', state: 'active', teamLabel: 'Platform Team', x: 700, y: 80, r: 24 },
  { id: 11, label: 'data-team', type: 'team', state: 'active', teamLabel: 'Data Team', x: 780, y: 480, r: 24 },
  { id: 12, label: 'PCI-DSS', type: 'pci', state: 'active', scopeLabel: 'PCI-DSS Scope', x: 150, y: 250, r: 30, critical: true },
  { id: 13, label: 'SOX', type: 'pci', state: 'active', scopeLabel: 'SOX Scope', x: 650, y: 200, r: 28 },
];

const MOCK_EDGES: MockEdge[] = [
  { s: 1, t: 2, type: 'calls' },
  { s: 2, t: 3, type: 'calls' },
  { s: 3, t: 4, type: 'calls' },
  { s: 4, t: 5, type: 'calls' },
  { s: 4, t: 6, type: 'calls' },
  { s: 6, t: 7, type: 'calls' },
  { s: 7, t: 8, type: 'calls' },
  { s: 9, t: 1, type: 'owns' },
  { s: 10, t: 2, type: 'owns' },
  { s: 10, t: 3, type: 'owns' },
  { s: 11, t: 8, type: 'owns' },
  { s: 1, t: 12, type: 'pci' },
  { s: 7, t: 12, type: 'pci' },
  { s: 3, t: 13, type: 'pci' },
  { s: 4, t: 13, type: 'pci' },
];

const stateColors: Record<NodeState, string> = {
  active: '#00e5a0',
  deprecated: '#f5a623',
  orphaned: '#e55a00',
  zombie: '#ff1744',
};

const typeConfig: Record<NodeType, { label: string; icon: React.ElementType; color: string }> = {
  api: { label: 'API Endpoint', icon: Server, color: '#6366f1' },
  team: { label: 'Team', icon: Users, color: '#7b5ea7' },
  pci: { label: 'Compliance Scope', icon: ShieldCheck, color: '#1a3a1a' },
};

const edgeConfig: Record<EdgeType, { label: string; color: string }> = {
  calls: { label: 'Calls', color: '#6366f1' },
  owns: { label: 'Owns', color: '#7b5ea7' },
  pci: { label: 'PCI Scope', color: '#1a3a1a' },
};

const edgeColors: Record<EdgeType, string> = {
  calls: '#6366f1',
  owns: '#7b5ea7',
  pci: '#1a3a1a',
};

const dashArrays: Record<EdgeType, string> = {
  calls: 'none',
  owns: '8,4',
  pci: '4,2',
};

export function KnowledgeGraphView() {
  const [selectedNode, setSelectedNode] = React.useState<MockNode | null>(null);
  const [highlighted, setHighlighted] = React.useState<number[]>([]);
  const [showEdges, setShowEdges] = React.useState<{ calls: boolean; owns: boolean; pci: boolean }>({
    calls: true, owns: true, pci: true
  });
  const [filterState, setFilterState] = React.useState<NodeState[]>([]);
  const [filterType, setFilterType] = React.useState<NodeType[]>([]);
  const panRef = React.useRef({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const allNodes = MOCK_NODES;
  const allEdges = MOCK_EDGES;

  const filteredNodes = allNodes.filter(n => {
    if (filterState.length && !filterState.includes(n.state)) return false;
    if (filterType.length && !filterType.includes(n.type)) return false;
    return true;
  });

  const filteredEdges = allEdges.filter(e => {
    if (!showEdges.calls && e.type === 'calls') return false;
    if (!showEdges.owns && e.type === 'owns') return false;
    if (!showEdges.pci && e.type === 'pci') return false;
    return filteredNodes.some(n => n.id === e.s) && filteredNodes.some(n => n.id === e.t);
  });

  const handleNodeClick = (node: MockNode) => {
    setSelectedNode(node);
    const connected = new Set<number>();
    connected.add(node.id);
    allEdges.forEach(edge => {
      if (edge.s === node.id) connected.add(edge.t);
      if (edge.t === node.id) connected.add(edge.s);
    });
    setHighlighted(Array.from(connected));
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
    setHighlighted([]);
  };

  const handleZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(3, prev - e.deltaY * 0.001)));
  };

  const stats = {
    totalNodes: filteredNodes.length,
    apiCount: filteredNodes.filter(n => n.type === 'api').length,
    teamCount: filteredNodes.filter(n => n.type === 'team').length,
    pciCount: filteredNodes.filter(n => n.type === 'pci').length,
    zombieCount: filteredNodes.filter(n => n.state === 'zombie').length,
    edgeCount: filteredEdges.length,
  };

  // Calculate viewBox based on all nodes
  const minX = Math.min(...allNodes.map(n => n.x - n.r)) - 50;
  const minY = Math.min(...allNodes.map(n => n.y - n.r)) - 50;
  const maxX = Math.max(...allNodes.map(n => n.x + n.r)) + 50;
  const maxY = Math.max(...allNodes.map(n => n.y + n.r)) + 50;
  const viewBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

  return (
  <div className="knowledge-graph-view">
    <header className="page-header animate-fade-in">
      <div className="page-header-main">
        <h1 className="page-title">Knowledge Graph</h1>
        <p className="page-description">Visualize API dependencies, ownership, and compliance scope</p>
      </div>
      <div className="page-header-actions">
        <button className="btn btn-primary">
          <Download size={16} /> Export PNG
        </button>
      </div>
    </header>

    <div className="graph-toolbar card animate-slide-in">
      <div className="toolbar-section">
                <label className="toolbar-label">Filter by State</label>
                <div className="filter-chips">
                  {(['active', 'deprecated', 'orphaned', 'zombie'] as NodeState[]).map(state => (
                    <button
                      key={state}
                      className={`filter-chip state-chip ${filterState.includes(state) ? 'active' : ''}`}
                      style={{ '--chip-color': stateColors[state] } as React.CSSProperties}
                      onClick={() => setFilterState(s => s.includes(state) ? s.filter(x => x !== state) : [...s, state])}
                    >
                      <span className="chip-dot" />
                      {state.charAt(0).toUpperCase() + state.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

      <div className="toolbar-section">
                <label className="toolbar-label">Filter by Type</label>
                <div className="filter-chips">
                  {(Object.keys(typeConfig) as NodeType[]).map(type => {
                    const config = typeConfig[type];
                    return (
                      <button
                        key={type}
                        className={`filter-chip type-chip ${filterType.includes(type) ? 'active' : ''}`}
                        style={{ '--chip-color': config.color } as React.CSSProperties}
                        onClick={() => setFilterType(s => s.includes(type) ? s.filter(x => x !== type) : [...s, type])}
                      >
                        <config.icon size={12} />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

      <div className="toolbar-section">
                <label className="toolbar-label">Edge Types</label>
                <div className="edge-toggles">
                  {(Object.entries(edgeConfig) as Array<[EdgeType, { label: string; color: string }]>).map(([key, edge]) => (
                    <label key={key} className="edge-toggle">
                      <input
                        type="checkbox"
                        checked={showEdges[key]}
                        onChange={e => setShowEdges(s => ({ ...s, [key]: e.target.checked }))}
                      />
                      <span className="edge-toggle-label" style={{ color: edge.color }}>
                        <span className="edge-toggle-dot" style={{ background: edge.color }} />
                        {edge.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

      <div className="toolbar-section toolbar-stats">
        <span className="stat"><strong>{stats.totalNodes}</strong> nodes</span>
        <span className="stat"><strong>{stats.edgeCount}</strong> edges</span>
        <span className="stat"><strong>{stats.zombieCount}</strong> zombies</span>
      </div>
    </div>

    <div className="graph-container card animate-slide-in" style={{ animationDelay: '100ms' }}>
      <div className="graph-wrapper" onClick={handleCanvasClick} onWheel={handleZoom}>
        <svg 
          ref={svgRef}
          className="graph-svg"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <defs>
            <marker id="arrowhead-calls" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
            </marker>
            <marker id="arrowhead-owns" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#7b5ea7" />
            </marker>
            <marker id="arrowhead-pci" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#1a3a1a" />
            </marker>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          <g className="edges-layer">
            {filteredEdges.map((edge, i) => {
              const source = filteredNodes.find(n => n.id === edge.s);
              const target = filteredNodes.find(n => n.id === edge.t);
              if (!source || !target) return null;

              return (
                <line
                  key={i}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={edgeColors[edge.type]}
                  strokeWidth={edge.type === 'calls' ? 2 : 1.5}
                  strokeDasharray={dashArrays[edge.type]}
                  markerEnd={`url(#arrowhead-${edge.type})`}
                  opacity={highlighted.length && (!highlighted.includes(edge.s) || !highlighted.includes(edge.t)) ? 0.2 : 1}
                  className="graph-edge"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes-layer">
            {filteredNodes.map(node => {
              const isHighlighted = highlighted.length === 0 || highlighted.includes(node.id);
                              const isSelected = selectedNode?.id === node.id;
                              const color = stateColors[node.state];
              return (
                <g 
                  key={node.id}
                  className="graph-node"
                  onClick={e => { e.stopPropagation(); handleNodeClick(node); }}
                  style={{ 
                    opacity: isHighlighted ? 1 : 0.3,
                    filter: isSelected ? 'url(#glow)' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={color}
                    stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.8)'}
                    strokeWidth={isSelected ? 3 : 2}
                    className="node-circle"
                  />
                  {node.critical && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 4}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray="6,4"
                      className="node-pulse"
                    />
                  )}
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={Math.max(10, node.r * 0.45)}
                    fontWeight={600}
                    fontFamily="Inter, sans-serif"
                    pointerEvents="none"
                  >
                    {node.type === 'api' ? node.label.split('-')[0].charAt(0).toUpperCase() : 
                     node.type === 'team' ? '👥' : '🔒'}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + node.r + 14}
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    fill={isHighlighted ? '#0f172a' : '#94a3b8'}
                    fontSize={11}
                    fontWeight={500}
                    fontFamily="Inter, sans-serif"
                    pointerEvents="none"
                  >
                    {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Zoom controls */}
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoom(z => Math.min(3, z * 1.2)); }}><Plus size={16} /></button>
          <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoom(1); panRef.current = { x: 0, y: 0 }; }}><Settings size={16} /></button>
          <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoom(z => Math.max(0.3, z / 1.2)); }}><Minus size={16} /></button>
        </div>
      </div>
    </div>

    {selectedNode && (
      <div className="node-detail-panel animate-slide-in">
        <div className="panel-header">
          <div className="panel-node-info">
          <div className="panel-node-badge" style={{ background: stateColors[selectedNode.state] }}>
            {(() => {
              const Icon = typeConfig[selectedNode.type].icon;
              return <Icon size={16} />;
            })()}
          </div>
            <div>
              <h3 className="panel-node-title">{selectedNode.label}</h3>
              <span className="panel-node-type">{typeConfig[selectedNode.type].label}</span>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={() => { setSelectedNode(null); setHighlighted([]); }}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="panel-body">
          <div className="detail-section">
            <h4>State</h4>
            <span className="badge" style={{ background: `${stateColors[selectedNode.state]}20`, color: stateColors[selectedNode.state] }}>
              {selectedNode.state.charAt(0).toUpperCase() + selectedNode.state.slice(1)}
            </span>
          </div>

          <div className="detail-section">
            <h4>Connections</h4>
            <div className="connection-list">
              {MOCK_EDGES
                .filter(e => e.s === selectedNode.id || e.t === selectedNode.id)
                .map((edge, i) => {
                  const otherId = edge.s === selectedNode.id ? edge.t : edge.s;
                  const other = MOCK_NODES.find(n => n.id === otherId);
                  const isOutgoing = edge.s === selectedNode.id;
                  if (!other) return null;
                  return (
                    <div key={i} className="connection-item">
                      <span className="connection-direction" style={{ color: isOutgoing ? edgeColors.calls : edgeColors.owns }}>
                        {isOutgoing ? '→' : '←'} {edge.type.charAt(0).toUpperCase() + edge.type.slice(1)}
                      </span>
                      <span className="connection-target">
                        <span className="connection-badge" style={{ background: stateColors[other.state] }}>
                          {other.label}
                        </span>
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="detail-section">
            <h4>Actions</h4>
            <div className="panel-actions">
              <button className="btn btn-primary btn-sm"><ExternalLink size={14} /> View in Explorer</button>
              <button className="btn btn-secondary btn-sm"><GitBranch size={14} /> Decommission Tracker</button>
              <button className="btn btn-secondary btn-sm"><ShieldCheck size={14} /> Compliance Report</button>
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="graph-legend card animate-fade-in" style={{ animationDelay: '200ms' }}>
      <div className="legend-section">
        <h4>Node States</h4>
        <div className="legend-items">
          {Object.entries(stateColors).map(([state, color]) => (
            <span key={state} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              {state.charAt(0).toUpperCase() + state.slice(1)}
            </span>
          ))}
        </div>
      </div>
      <div className="legend-section">
        <h4>Node Types</h4>
        <div className="legend-items">
          {(Object.entries(typeConfig) as Array<[string, typeof typeConfig.api]>).map(([type, config]) => (
            <span key={type} className="legend-item">
              <config.icon size={12} style={{ color: config.color }} />
              {config.label}
            </span>
          ))}
        </div>
      </div>
      <div className="legend-section">
        <h4>Edge Types</h4>
        <div className="legend-items">
          <span className="legend-item"><span className="legend-line" style={{ background: '#6366f1' }} /> Calls</span>
          <span className="legend-item"><span className="legend-line" style={{ background: '#7b5ea7', borderTop: '2px dashed #7b5ea7' }} /> Owns</span>
          <span className="legend-item"><span className="legend-line" style={{ background: '#1a3a1a', borderTop: '2px dotted #1a3a1a' }} /> PCI Scope</span>
        </div>
      </div>
    </div>
  </div>
  );
}