import { type Node, type Edge } from "@xyflow/react";

/**
 * DAG 사이클 감지 — DFS 기반
 * 순환 참조가 있으면 true 반환
 */
export function detectCycle(nodes: Node[], edges: Edge[]): boolean {
  const adjacency = buildAdjacency(nodes, edges);
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);

    for (const neighbor of adjacency.get(nodeId) ?? []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true;
      }
    }

    inStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }

  return false;
}

/**
 * 토폴로지 정렬 — Kahn's 알고리즘
 * 실행 순서를 반환한다. 사이클이 있으면 에러.
 */
export function topologicalSort(nodes: Node[], edges: Edge[]): string[] {
  // 진입 차수 계산
  const inDegree = new Map<string, number>();
  const adjacency = buildAdjacency(nodes, edges);

  for (const node of nodes) {
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // 진입 차수 0인 노드부터 시작
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (result.length !== nodes.length) {
    throw new Error("그래프에 사이클이 존재합니다");
  }

  return result;
}

/**
 * 엣지에서 특정 sourceHandle로 연결된 타겟 노드 ID 목록
 */
export function getTargetsByHandle(
  edges: Edge[],
  sourceId: string,
  handle: string | null
): string[] {
  return edges
    .filter((e) => e.source === sourceId && e.sourceHandle === handle)
    .map((e) => e.target);
}

function buildAdjacency(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }

  return adjacency;
}
