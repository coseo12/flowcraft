import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeWorkflow } from "./executor";
import { type Node, type Edge } from "@xyflow/react";

/**
 * 기획서 섹션 6. DAG 실행 엔진 — 실행기 테스트
 *
 * - 노드를 순차 실행하고 상태가 idle → running → success로 전이
 * - 노드 실행 실패 시 후속 노드는 skipped 처리
 * - 이전 노드의 출력이 다음 노드의 입력으로 전달
 * - 조건 분기 시 true/false 경로에 따라 실행
 * - 사이클이 있으면 실행하지 않고 에러
 */

const triggerNode = (id: string): Node => ({
  id,
  type: "httpTrigger",
  position: { x: 0, y: 0 },
  data: { label: "Trigger", nodeType: "httpTrigger" },
});

const scriptNode = (id: string, code: string): Node => ({
  id,
  type: "script",
  position: { x: 0, y: 0 },
  data: { label: "Script", nodeType: "script", code },
});

const logNode = (id: string): Node => ({
  id,
  type: "logOutput",
  position: { x: 0, y: 0 },
  data: { label: "Log", nodeType: "logOutput", logLabel: "결과" },
});

const conditionNode = (
  id: string,
  field: string,
  operator: string,
  value: string
): Node => ({
  id,
  type: "condition",
  position: { x: 0, y: 0 },
  data: { label: "조건", nodeType: "condition", field, operator, value },
});

const edge = (source: string, target: string, sourceHandle?: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  sourceHandle: sourceHandle ?? null,
});

describe("executeWorkflow", () => {
  it("직선 워크플로우를 순차 실행한다 (Trigger → Script → Log)", async () => {
    const nodes = [
      triggerNode("t"),
      scriptNode("s", "return { result: 42 };"),
      logNode("l"),
    ];
    const edges = [edge("t", "s"), edge("s", "l")];

    const onStatusChange = vi.fn();
    await executeWorkflow(nodes, edges, "wf-1", onStatusChange);

    // 각 노드가 running → success 순서로 호출됨
    const statusCalls = onStatusChange.mock.calls.map(
      ([nodeId, status]: [string, string]) => `${nodeId}:${status}`
    );

    expect(statusCalls).toContain("t:running");
    expect(statusCalls).toContain("t:success");
    expect(statusCalls).toContain("s:running");
    expect(statusCalls).toContain("s:success");
    expect(statusCalls).toContain("l:running");
    expect(statusCalls).toContain("l:success");
  });

  it("이전 노드의 출력이 다음 노드의 입력으로 전달된다", async () => {
    const nodes = [
      triggerNode("t"),
      scriptNode("s1", "return { value: 10 };"),
      scriptNode("s2", "return { doubled: input.value * 2 };"),
    ];
    const edges = [edge("t", "s1"), edge("s1", "s2")];

    const results: Record<string, unknown> = {};
    const onStatusChange = vi.fn(
      (nodeId: string, status: string, data?: { output?: unknown }) => {
        if (status === "success" && data?.output) {
          results[nodeId] = data.output;
        }
      }
    );

    await executeWorkflow(nodes, edges, "wf-1", onStatusChange);
    expect(results["s2"]).toEqual({ doubled: 20 });
  });

  it("노드 실행 실패 시 후속 노드는 skipped 처리된다", async () => {
    const nodes = [
      triggerNode("t"),
      scriptNode("fail", "throw new Error('실패');"),
      logNode("l"),
    ];
    const edges = [edge("t", "fail"), edge("fail", "l")];

    const onStatusChange = vi.fn();
    await executeWorkflow(nodes, edges, "wf-1", onStatusChange);

    const statusCalls = onStatusChange.mock.calls.map(
      ([nodeId, status]: [string, string]) => `${nodeId}:${status}`
    );

    expect(statusCalls).toContain("fail:error");
    expect(statusCalls).toContain("l:skipped");
  });

  it("조건 분기 시 true 경로만 실행된다", async () => {
    const nodes = [
      triggerNode("t"),
      scriptNode("s", "return { status: 200 };"),
      conditionNode("c", "input.status", "==", "200"),
      logNode("yes"),
      logNode("no"),
    ];
    const edges = [
      edge("t", "s"),
      edge("s", "c"),
      edge("c", "yes", "true"),
      edge("c", "no", "false"),
    ];

    const onStatusChange = vi.fn();
    await executeWorkflow(nodes, edges, "wf-1", onStatusChange);

    const statusCalls = onStatusChange.mock.calls.map(
      ([nodeId, status]: [string, string]) => `${nodeId}:${status}`
    );

    expect(statusCalls).toContain("yes:success");
    expect(statusCalls).toContain("no:skipped");
  });

  it("조건 분기 시 false 경로만 실행된다", async () => {
    const nodes = [
      triggerNode("t"),
      scriptNode("s", "return { status: 404 };"),
      conditionNode("c", "input.status", "==", "200"),
      logNode("yes"),
      logNode("no"),
    ];
    const edges = [
      edge("t", "s"),
      edge("s", "c"),
      edge("c", "yes", "true"),
      edge("c", "no", "false"),
    ];

    const onStatusChange = vi.fn();
    await executeWorkflow(nodes, edges, "wf-1", onStatusChange);

    const statusCalls = onStatusChange.mock.calls.map(
      ([nodeId, status]: [string, string]) => `${nodeId}:${status}`
    );

    expect(statusCalls).toContain("yes:skipped");
    expect(statusCalls).toContain("no:success");
  });

  it("사이클이 있으면 에러를 던진다", async () => {
    const nodes = [triggerNode("a"), scriptNode("b", "return input;")];
    const edges = [edge("a", "b"), edge("b", "a")];

    await expect(
      executeWorkflow(nodes, edges, "wf-1", vi.fn())
    ).rejects.toThrow();
  });
});
