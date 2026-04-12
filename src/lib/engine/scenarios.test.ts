import { describe, it, expect, vi } from "vitest";
import { executeWorkflow } from "./executor";
import { type Node, type Edge } from "@xyflow/react";

/**
 * 기획서 섹션 5. 사용자 시나리오 기반 통합 테스트
 *
 * 시나리오 1: API 데이터 가공 워크플로우
 *   HTTP Trigger → Script (데이터 생성) → Script (가공) → Log
 *
 * 시나리오 2: 조건 분기 워크플로우
 *   HTTP Trigger → Script (상태 반환) → Condition → Log(성공) / Log(실패)
 */

const trigger = (id: string): Node => ({
  id,
  type: "httpTrigger",
  position: { x: 0, y: 0 },
  data: { label: "Trigger", nodeType: "httpTrigger" },
});

const script = (id: string, code: string, label = "Script"): Node => ({
  id,
  type: "script",
  position: { x: 0, y: 0 },
  data: { label, nodeType: "script", code },
});

const condition = (
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

const log = (id: string, logLabel: string): Node => ({
  id,
  type: "logOutput",
  position: { x: 0, y: 0 },
  data: { label: logLabel, nodeType: "logOutput", logLabel },
});

const edge = (source: string, target: string, sourceHandle?: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  sourceHandle: sourceHandle ?? null,
});

describe("시나리오 1: API 데이터 가공 워크플로우", () => {
  it("Trigger → 데이터 생성 → 필터링 → 로그 출력 전체 흐름이 동작한다", async () => {
    const nodes = [
      trigger("t"),
      script(
        "generate",
        `return {
          users: [
            { name: "홍길동", id: 1 },
            { name: "김철수", id: 2 },
            { name: "이영희", id: 3 },
            { name: "박민수", id: 4 },
            { name: "최지은", id: 5 },
          ]
        };`,
        "데이터 생성"
      ),
      script(
        "filter",
        `const filtered = input.users.filter(u => u.id <= 3);
         return { users: filtered, count: filtered.length };`,
        "필터링"
      ),
      log("result", "필터링 결과"),
    ];
    const edges = [
      edge("t", "generate"),
      edge("generate", "filter"),
      edge("filter", "result"),
    ];

    const results: Record<string, unknown> = {};
    const statuses: string[] = [];

    await executeWorkflow(
      nodes,
      edges,
      "wf-scenario1",
      (nodeId, status, data) => {
        statuses.push(`${nodeId}:${status}`);
        if (status === "success" && data?.output) {
          results[nodeId] = data.output;
        }
      }
    );

    // 모든 노드가 성공
    expect(statuses).toContain("t:success");
    expect(statuses).toContain("generate:success");
    expect(statuses).toContain("filter:success");
    expect(statuses).toContain("result:success");

    // 필터링 결과 검증
    const filterOutput = results["filter"] as { users: unknown[]; count: number };
    expect(filterOutput.count).toBe(3);
    expect(filterOutput.users).toHaveLength(3);

    // 로그에 필터링 결과가 전달됨
    const logOutput = results["result"] as { label: string; data: unknown };
    expect(logOutput.label).toBe("필터링 결과");
    expect(logOutput.data).toEqual(filterOutput);
  });
});

describe("시나리오 2: 조건 분기 워크플로우", () => {
  it("상태 200이면 성공 경로로 분기한다", async () => {
    const nodes = [
      trigger("t"),
      script("api", "return { status: 200, data: 'OK' };", "API 호출"),
      condition("check", "input.status", "==", "200"),
      log("yes", "성공"),
      log("no", "실패"),
    ];
    const edges = [
      edge("t", "api"),
      edge("api", "check"),
      edge("check", "yes", "true"),
      edge("check", "no", "false"),
    ];

    const statuses: string[] = [];
    await executeWorkflow(nodes, edges, "wf-s2-200", (nodeId, status) => {
      statuses.push(`${nodeId}:${status}`);
    });

    expect(statuses).toContain("yes:success");
    expect(statuses).toContain("no:skipped");
  });

  it("상태 404이면 실패 경로로 분기한다", async () => {
    const nodes = [
      trigger("t"),
      script("api", "return { status: 404, data: 'Not Found' };", "API 호출"),
      condition("check", "input.status", "==", "200"),
      log("yes", "성공"),
      log("no", "실패"),
    ];
    const edges = [
      edge("t", "api"),
      edge("api", "check"),
      edge("check", "yes", "true"),
      edge("check", "no", "false"),
    ];

    const statuses: string[] = [];
    const results: Record<string, unknown> = {};

    await executeWorkflow(nodes, edges, "wf-s2-404", (nodeId, status, data) => {
      statuses.push(`${nodeId}:${status}`);
      if (status === "success" && data?.output) {
        results[nodeId] = data.output;
      }
    });

    expect(statuses).toContain("yes:skipped");
    expect(statuses).toContain("no:success");

    // 실패 로그에 API 응답이 전달됨
    const logOutput = results["no"] as { label: string; data: unknown };
    expect(logOutput.label).toBe("실패");
  });

  it("에러 발생 시 후속 모든 노드가 skipped된다", async () => {
    const nodes = [
      trigger("t"),
      script("crash", "throw new Error('서버 장애');", "장애 API"),
      condition("check", "input.status", "==", "200"),
      log("yes", "성공"),
      log("no", "실패"),
    ];
    const edges = [
      edge("t", "crash"),
      edge("crash", "check"),
      edge("check", "yes", "true"),
      edge("check", "no", "false"),
    ];

    const statuses: string[] = [];
    await executeWorkflow(nodes, edges, "wf-s2-error", (nodeId, status) => {
      statuses.push(`${nodeId}:${status}`);
    });

    expect(statuses).toContain("crash:error");
    expect(statuses).toContain("check:skipped");
    expect(statuses).toContain("yes:skipped");
    expect(statuses).toContain("no:skipped");
  });
});
