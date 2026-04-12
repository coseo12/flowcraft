import { describe, it, expect } from "vitest";
import { topologicalSort, detectCycle } from "./dag";
import { type Node, type Edge } from "@xyflow/react";

/**
 * 기획서 섹션 6. DAG 실행 엔진 — 그래프 분석
 *
 * - 토폴로지 정렬으로 올바른 실행 순서 결정
 * - 사이클 감지로 순환 참조 방지
 * - 분기(조건문) 노드의 다중 출력 핸들 처리
 */

const node = (id: string): Node => ({
  id,
  type: "default",
  position: { x: 0, y: 0 },
  data: { label: id },
});

const edge = (source: string, target: string, sourceHandle?: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  sourceHandle: sourceHandle ?? null,
});

describe("topologicalSort", () => {
  it("직선 그래프의 실행 순서를 반환한다 (A → B → C)", () => {
    const nodes = [node("A"), node("B"), node("C")];
    const edges = [edge("A", "B"), edge("B", "C")];

    const order = topologicalSort(nodes, edges);
    expect(order).toEqual(["A", "B", "C"]);
  });

  it("분기가 있는 그래프에서 의존성 순서를 보장한다", () => {
    // A → B, A → C, B → D, C → D
    const nodes = [node("A"), node("B"), node("C"), node("D")];
    const edges = [edge("A", "B"), edge("A", "C"), edge("B", "D"), edge("C", "D")];

    const order = topologicalSort(nodes, edges);

    // A는 반드시 B, C보다 먼저
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("B"));
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("C"));
    // B, C는 반드시 D보다 먼저
    expect(order.indexOf("B")).toBeLessThan(order.indexOf("D"));
    expect(order.indexOf("C")).toBeLessThan(order.indexOf("D"));
  });

  it("노드가 하나뿐인 그래프를 처리한다", () => {
    const nodes = [node("A")];
    const edges: Edge[] = [];

    const order = topologicalSort(nodes, edges);
    expect(order).toEqual(["A"]);
  });

  it("연결되지 않은 노드도 결과에 포함한다", () => {
    const nodes = [node("A"), node("B"), node("C")];
    const edges = [edge("A", "B")];

    const order = topologicalSort(nodes, edges);
    expect(order).toHaveLength(3);
    expect(order).toContain("C");
  });
});

describe("detectCycle", () => {
  it("사이클이 없는 그래프에서 false를 반환한다", () => {
    const nodes = [node("A"), node("B"), node("C")];
    const edges = [edge("A", "B"), edge("B", "C")];

    expect(detectCycle(nodes, edges)).toBe(false);
  });

  it("직접 사이클(A → B → A)을 감지한다", () => {
    const nodes = [node("A"), node("B")];
    const edges = [edge("A", "B"), edge("B", "A")];

    expect(detectCycle(nodes, edges)).toBe(true);
  });

  it("간접 사이클(A → B → C → A)을 감지한다", () => {
    const nodes = [node("A"), node("B"), node("C")];
    const edges = [edge("A", "B"), edge("B", "C"), edge("C", "A")];

    expect(detectCycle(nodes, edges)).toBe(true);
  });

  it("자기 자신으로의 사이클을 감지한다", () => {
    const nodes = [node("A")];
    const edges = [edge("A", "A")];

    expect(detectCycle(nodes, edges)).toBe(true);
  });
});
