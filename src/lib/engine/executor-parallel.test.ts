import { describe, it, expect, vi } from "vitest";
import { executeWorkflow } from "./executor";
import { type Node, type Edge } from "@xyflow/react";

/**
 * DAG 엔진 병렬 실행 테스트
 *
 * - 의존성 없는 노드가 동시 실행
 * - 병렬 노드 분기 후 합류
 */

const trigger = (id: string): Node => ({
  id,
  type: "httpTrigger",
  position: { x: 0, y: 0 },
  data: { label: "Trigger", nodeType: "httpTrigger" },
});

const script = (id: string, code: string): Node => ({
  id,
  type: "script",
  position: { x: 0, y: 0 },
  data: { label: id, nodeType: "script", code },
});

const log = (id: string): Node => ({
  id,
  type: "logOutput",
  position: { x: 0, y: 0 },
  data: { label: id, nodeType: "logOutput", logLabel: id },
});

const edge = (source: string, target: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  sourceHandle: null,
});

describe("병렬 실행", () => {
  it("의존성 없는 노드 B와 C가 A 이후에 실행된다", async () => {
    // A → B, A → C, B → D, C → D
    const nodes = [
      trigger("A"),
      script("B", "return { from: 'B' };"),
      script("C", "return { from: 'C' };"),
      log("D"),
    ];
    const edges = [
      edge("A", "B"),
      edge("A", "C"),
      edge("B", "D"),
      edge("C", "D"),
    ];

    const statusOrder: string[] = [];
    await executeWorkflow(nodes, edges, "wf-parallel", (nodeId, status) => {
      statusOrder.push(`${nodeId}:${status}`);
    });

    // A가 B, C보다 먼저 실행
    const aSuccess = statusOrder.indexOf("A:success");
    const bRunning = statusOrder.indexOf("B:running");
    const cRunning = statusOrder.indexOf("C:running");
    expect(aSuccess).toBeLessThan(bRunning);
    expect(aSuccess).toBeLessThan(cRunning);

    // D는 B, C 이후에 실행
    const dRunning = statusOrder.indexOf("D:running");
    const bSuccess = statusOrder.indexOf("B:success");
    const cSuccess = statusOrder.indexOf("C:success");
    expect(dRunning).toBeGreaterThan(bSuccess);
    expect(dRunning).toBeGreaterThan(cSuccess);

    // 모든 노드 성공
    expect(statusOrder).toContain("D:success");
  });
});
