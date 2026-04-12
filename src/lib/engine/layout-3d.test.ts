import { describe, it, expect } from "vitest";
import { to3DPosition, build3DPositionMap } from "./layout-3d";
import { type Node } from "@xyflow/react";

const node = (id: string, x: number, y: number): Node => ({
  id,
  type: "default",
  position: { x, y },
  data: { label: id },
});

describe("layout-3d", () => {
  it("단일 노드는 원점에 배치된다", () => {
    const nodes = [node("a", 100, 100)];
    const pos = to3DPosition(nodes[0], nodes);
    expect(pos[0]).toBeCloseTo(0);
    expect(pos[1]).toBeCloseTo(0);
    expect(pos[2]).toBeCloseTo(0);
  });

  it("두 노드는 중심 기준으로 대칭 배치된다", () => {
    const nodes = [node("a", 0, 0), node("b", 200, 0)];
    const posA = to3DPosition(nodes[0], nodes);
    const posB = to3DPosition(nodes[1], nodes);

    // A는 음의 x, B는 양의 x
    expect(posA[0]).toBeLessThan(0);
    expect(posB[0]).toBeGreaterThan(0);
    // 대칭이므로 절대값 동일
    expect(Math.abs(posA[0])).toBeCloseTo(Math.abs(posB[0]));
  });

  it("positionMap이 모든 노드를 포함한다", () => {
    const nodes = [node("a", 0, 0), node("b", 100, 0), node("c", 200, 100)];
    const map = build3DPositionMap(nodes);

    expect(map.size).toBe(3);
    expect(map.has("a")).toBe(true);
    expect(map.has("b")).toBe(true);
    expect(map.has("c")).toBe(true);
  });

  it("y 좌표가 3D에서 -z로 매핑된다", () => {
    const nodes = [node("a", 100, 0), node("b", 100, 200)];
    const posA = to3DPosition(nodes[0], nodes);
    const posB = to3DPosition(nodes[1], nodes);

    // y가 큰 노드가 z가 더 작음 (음의 방향)
    expect(posA[2]).toBeGreaterThan(posB[2]);
  });
});
