import type { KGNode, KGEdge, Endpoint } from "./types";
/**
 * Knowledge Graph - Living Digital Twin of API Ecosystem
 *
 * Nodes: APIs (colored by lifecycle state), Teams, PCI Data Objects
 * Edges: calls/calledBy (API dependencies), owns (Team → API), exposesData (API → PCI)
 */
export interface KnowledgeGraph {
    nodes: KGNode[];
    edges: KGEdge[];
}
/**
 * Build knowledge graph from endpoints
 * Positions are computed via force-directed layout or provided manually
 */
export declare function buildKnowledgeGraph(endpoints: Endpoint[]): KnowledgeGraph;
/**
 * Get color for node based on state
 */
export declare function getNodeColor(node: KGNode): string;
/**
 * Highlight node and its connected neighbors
 */
export declare function getHighlightedNodes(graph: KnowledgeGraph, nodeId: string | number | null): Set<string | number>;
/**
 * Generate SVG for knowledge graph rendering
 */
export declare function renderKnowledgeGraph(graph: KnowledgeGraph, highlighted?: Set<string | number>): string;
//# sourceMappingURL=knowledge-graph.d.ts.map