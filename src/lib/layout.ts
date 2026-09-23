import dagre from 'dagre';
import type { Edge, Node } from '@xyflow/react';
import { Position } from '@xyflow/react';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 60;

/**
 * Räknar ut automatisk trädlayout med dagre.
 * `direction`: "LR" (vänster→höger) eller "TB" (topp→botten).
 */
export function layoutTree(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR',
): { nodes: Node[]; edges: Edge[] } {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 90 });

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const isHorizontal = direction === 'LR';

  const laidOutNodes = nodes.map((node) => {
    const { x, y } = graph.node(node.id);
    return {
      ...node,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      // dagre placerar noden i mitten, React Flow vill ha övre vänstra hörnet.
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
    };
  });

  return { nodes: laidOutNodes, edges };
}
