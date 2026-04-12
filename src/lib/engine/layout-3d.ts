import { type Node, type Edge } from "@xyflow/react";

/**
 * 2D 에디터의 노드 위치를 3D 좌표로 변환한다.
 * 2D (x, y) → 3D (x, 0, -z) 로 매핑하고 정규화한다.
 */

const SCALE = 0.01;
const SPREAD = 2;

export function to3DPosition(
  node: Node,
  allNodes: Node[]
): [number, number, number] {
  if (allNodes.length === 0) return [0, 0, 0];

  // 전체 노드의 중심점 계산
  let cx = 0, cy = 0;
  for (const n of allNodes) {
    cx += n.position.x;
    cy += n.position.y;
  }
  cx /= allNodes.length;
  cy /= allNodes.length;

  // 중심 기준으로 정규화
  const x = (node.position.x - cx) * SCALE * SPREAD;
  const z = (node.position.y - cy) * SCALE * SPREAD;

  return [x, 0, -z];
}

/**
 * 3D 위치 맵을 생성한다.
 */
export function build3DPositionMap(
  nodes: Node[]
): Map<string, [number, number, number]> {
  const map = new Map<string, [number, number, number]>();
  for (const node of nodes) {
    map.set(node.id, to3DPosition(node, nodes));
  }
  return map;
}
