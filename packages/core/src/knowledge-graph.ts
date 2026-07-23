import type {
  KGNode,
  KGEdge,
  LifecycleState,
  Endpoint,
  AuthMechanism,
  TlsVersion,
  TrafficTrend,
  GatewayType,
} from './types.js';
import { STATE_COLORS } from './types.js';

/**
 * Knowledge Graph - Living Digital Twin of API Ecosystem
 *
 * Nodes: APIs (colored by lifecycle state), Teams, PCI Data Objects
 * Edges: calls/calledBy (API dependencies), owns (Team → API), exposesData (API → PCI)
 */

/**
 * Convert Prisma endpoint to core Endpoint type for knowledge graph
 */
export function toEndpointFull(ep: Record<string, unknown>): Endpoint {
  const ri = ep.ri as number;
  const riBand = ri > 2.5 ? 'Critical' : ri > 1.5 ? 'High' : ri > 0.8 ? 'Medium' : 'Low';
  return {
    id: ep.id as number,
    method: ep.method as string,
    path: ep.path as string,
    service: ep.service as string,
    s: ep.sensitivity as number,
    e: ep.exposure as number,
    a: ep.ageMonths as number,
    pci: ep.pci as boolean,
    auth: ep.authMechanism as AuthMechanism,
    tls: ep.tlsVersion as TlsVersion,
    rateLimited: ep.rateLimited as boolean,
    wafCoverage: ep.wafCoverage as boolean,
    mtls: ep.mtls as boolean,
    apiKeyExposed: ep.apiKeyExposed as boolean,
    egressVal: ep.egressValidated as boolean,
    owner: ep.owner as string,
    ownerActive: ep.ownerActive as boolean,
    sunsetHeader: (ep.sunsetHeader as string) || '',
    trafficTrend: ep.trafficTrend as TrafficTrend,
    trafficP90: ep.trafficP90 as number,
    lastTraffic: ep.lastTraffic as string,
    lastCommit: ep.lastCommit as string,
    decayProb: ep.decayProb as number,
    gateway: ep.gateway as GatewayType,
    deployedOn: ep.deployedOn as string,
    calledBy: ep.calledBy as number[],
    calls: ep.calls as number[],
    v: ep.v as number,
    ri,
    state: (ep.lifecycleState as string).toLowerCase() as LifecycleState,
    predictedZombieDate: null,
    riBand,
  };
}

export interface KnowledgeGraph {
  nodes: KGNode[];
  edges: KGEdge[];
}

/**
 * Build knowledge graph from endpoints
 * Positions are computed via force-directed layout or provided manually
 */
export function buildKnowledgeGraph(endpoints: Endpoint[]): KnowledgeGraph {
  const nodeMap = new Map<string | number, KGNode>();
  const edges: KGEdge[] = [];

  // Create API nodes
  for (const ep of endpoints) {
    const traffic = ep.trafficP90 || 0;
    const radius = Math.max(6, Math.min(15, Math.log10(traffic + 1) * 4));

    nodeMap.set(ep.id, {
      id: ep.id,
      type: 'api',
      x: 0, // Will be set by layout
      y: 0,
      state: ep.state,
      label: ep.path.split('/').pop() || ep.path,
      r: radius,
      critical: ep.ri > 2.5,
    });
  }

  // Create call edges
  for (const ep of endpoints) {
    for (const calledId of ep.calls) {
      if (nodeMap.has(calledId)) {
        edges.push({ s: ep.id, t: calledId, type: 'calls' });
      }
    }
  }

  // Create team nodes
  const teamMap = new Map<string, { x: number; y: number }>();
  for (const ep of endpoints) {
    if (!teamMap.has(ep.owner)) {
      teamMap.set(ep.owner, { x: 0, y: 0 });
    }
  }

  // Assign team positions (right side)
  const teamEntries = Array.from(teamMap.entries());
  teamEntries.forEach(([team, pos], i) => {
    const teamId = `team-${team.replace(/\s+/g, '-').toLowerCase()}`;
    pos.x = 580 + (i % 3) * 40;
    pos.y = 100 + Math.floor(i / 3) * 120;

    nodeMap.set(teamId, {
      id: teamId,
      type: 'team',
      x: pos.x,
      y: pos.y,
      state: 'team',
      label: team,
    });
  });

  // Create owns edges (team → API)
  for (const ep of endpoints) {
    const teamId = `team-${ep.owner.replace(/\s+/g, '-').toLowerCase()}`;
    if (nodeMap.has(teamId)) {
      edges.push({ s: teamId, t: ep.id, type: 'owns' });
    }
  }

  // Create PCI data node
  const pciNodeId = 'pci-data';
  nodeMap.set(pciNodeId, {
    id: pciNodeId,
    type: 'pci',
    x: 280,
    y: 340,
    state: 'pci',
    label: 'PCI Card Data',
  });

  // Create PCI edges (API → PCI)
  for (const ep of endpoints) {
    if (ep.pci) {
      edges.push({ s: ep.id, t: pciNodeId, type: 'pci' });
    }
  }

  return { nodes: Array.from(nodeMap.values()), edges };
}

/**
 * Get color for node based on state
 */
export function getNodeColor(node: KGNode): string {
  return STATE_COLORS[node.state as LifecycleState] || STATE_COLORS.team;
}

/**
 * Highlight node and its connected neighbors
 */
export function getHighlightedNodes(
  graph: KnowledgeGraph,
  nodeId: string | number | null
): Set<string | number> {
  if (nodeId === null) return new Set();

  const highlighted = new Set([nodeId]);

  for (const edge of graph.edges) {
    if (edge.s === nodeId) highlighted.add(edge.t);
    if (edge.t === nodeId) highlighted.add(edge.s);
  }

  return highlighted;
}

/**
 * Generate SVG for knowledge graph rendering
 */
export function renderKnowledgeGraph(
  graph: KnowledgeGraph,
  highlighted: Set<string | number> = new Set()
): string {
  const { nodes, edges } = graph;
  let svg = '';

  // Draw edges first (behind nodes)
  for (const edge of edges) {
    const source = nodes.find((n) => n.id === edge.s);
    const target = nodes.find((n) => n.id === edge.t);
    if (!source || !target) continue;

    const isHighlighted = highlighted.has(edge.s) && highlighted.has(edge.t);
    const opacity = isHighlighted ? 0.7 : 0.12;
    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2 - 18;
    const path = `M${source.x},${source.y} Q${mx},${my} ${target.x},${target.y}`;

    let stroke = '#00b4ff';
    if (edge.type === 'pci') stroke = '#ff1744';
    else if (edge.type === 'owns') stroke = '#4a6a85';

    svg += `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${edge.type === 'calls' ? '1.5' : '1'}" stroke-dasharray="${edge.type === 'pci' ? '4,3' : 'none'}" opacity="${opacity}"/>`;
  }

  // Draw nodes
  for (const node of nodes) {
    const isHighlighted = highlighted.size === 0 || highlighted.has(node.id);
    const opacity = isHighlighted ? 1 : 0.2;
    const color = getNodeColor(node);

    if (node.type === 'team') {
      svg += `
        <g style="opacity:${opacity};cursor:pointer">
          <rect x="${node.x - 10}" y="${node.y - 7}" width="20" height="14" fill="${color}" opacity="0.7" rx="2"/>
          <text x="${node.x}" y="${node.y + 18}" text-anchor="middle" fill="${color}" font-family="JetBrains Mono" font-size="7">${node.label}</text>
        </g>`;
    } else if (node.type === 'pci') {
      svg += `
        <g style="opacity:${opacity};cursor:pointer">
          <polygon points="${node.x},${node.y - 10} ${node.x + 9},${node.y + 5} ${node.x - 9},${node.y + 5}" fill="#1a3a1a" stroke="#ff1744" stroke-width="1.5" opacity="0.9"/>
          <text x="${node.x}" y="${node.y + 18}" text-anchor="middle" fill="#ff1744" font-family="JetBrains Mono" font-size="7">${node.label}</text>
        </g>`;
    } else {
      const r = node.r || 8;
      const isZombie = node.state === 'zombie' || node.critical;
      const glowId = `glow-${node.id}`;
      const filter = isZombie
        ? `<filter id="${glowId}"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
        : '';
      const filterAttr = isZombie ? `filter="url(#${glowId})"` : '';

      svg += `${filter}
        <g style="opacity:${opacity};cursor:pointer">
          <circle cx="${node.x}" cy="${node.y}" r="${r + 3}" fill="${color}" opacity="0.1" ${filterAttr}/>
          <circle cx="${node.x}" cy="${node.y}" r="${r}" fill="${color}" opacity="0.65" stroke="${color}" stroke-width="${isZombie ? 2 : 1}"/>
          ${node.critical ? `<circle cx="${node.x}" cy="${node.y}" r="${r + 6}" fill="none" stroke="#ff1744" stroke-width="1" stroke-dasharray="3,2" opacity="0.5"/>` : ''}
          <text x="${node.x}" y="${node.y + 4}" text-anchor="middle" fill="rgba(0,0,0,0.85)" font-family="JetBrains Mono" font-size="6.5" font-weight="700">${node.id}</text>
          <text x="${node.x}" y="${node.y + r + 10}" text-anchor="middle" fill="${color}" font-family="JetBrains Mono" font-size="7" opacity="0.85">${node.label}</text>
        </g>`;
    }
  }

  return svg;
}
