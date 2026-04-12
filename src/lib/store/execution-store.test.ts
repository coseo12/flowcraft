import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "./execution-store";

/**
 * 기획서 F2. 워크플로우 실행 기반 테스트 시나리오
 *
 * - 실행 시작 시 모든 노드가 idle 상태로 초기화
 * - 노드별 상태가 독립적으로 업데이트
 * - 상태 머신: idle → running → success | error | skipped
 * - 로그 엔트리 추가 및 조회
 * - 실행 완료 시 isRunning이 false로 변경
 */

describe("ExecutionStore", () => {
  beforeEach(() => {
    useExecutionStore.getState().reset();
  });

  it("초기 상태는 실행 중이 아니다", () => {
    const state = useExecutionStore.getState();
    expect(state.isRunning).toBe(false);
    expect(state.executionId).toBeNull();
    expect(state.logs).toHaveLength(0);
  });

  it("실행 시작 시 모든 노드가 idle 상태로 초기화된다", () => {
    useExecutionStore.getState().startExecution("exec-1", ["a", "b", "c"]);

    const state = useExecutionStore.getState();
    expect(state.isRunning).toBe(true);
    expect(state.executionId).toBe("exec-1");
    expect(state.nodeStates["a"].status).toBe("idle");
    expect(state.nodeStates["b"].status).toBe("idle");
    expect(state.nodeStates["c"].status).toBe("idle");
  });

  it("노드 상태를 개별적으로 업데이트할 수 있다", () => {
    useExecutionStore.getState().startExecution("exec-1", ["a", "b"]);

    useExecutionStore.getState().updateNodeStatus("a", {
      status: "running",
      startedAt: "2026-04-13T10:00:00Z",
    });

    expect(useExecutionStore.getState().nodeStates["a"].status).toBe("running");
    expect(useExecutionStore.getState().nodeStates["b"].status).toBe("idle");
  });

  it("노드 상태를 success로 업데이트할 때 출력 데이터를 포함할 수 있다", () => {
    useExecutionStore.getState().startExecution("exec-1", ["a"]);

    useExecutionStore.getState().updateNodeStatus("a", {
      status: "success",
      output: { data: [1, 2, 3] },
      durationMs: 150,
    });

    const nodeState = useExecutionStore.getState().nodeStates["a"];
    expect(nodeState.status).toBe("success");
    expect(nodeState.output).toEqual({ data: [1, 2, 3] });
    expect(nodeState.durationMs).toBe(150);
  });

  it("노드 상태를 error로 업데이트할 때 에러 메시지를 포함할 수 있다", () => {
    useExecutionStore.getState().startExecution("exec-1", ["a"]);

    useExecutionStore.getState().updateNodeStatus("a", {
      status: "error",
      error: "Connection refused",
    });

    const nodeState = useExecutionStore.getState().nodeStates["a"];
    expect(nodeState.status).toBe("error");
    expect(nodeState.error).toBe("Connection refused");
  });

  it("로그 엔트리를 추가할 수 있다", () => {
    useExecutionStore.getState().addLog({
      timestamp: "14:02:31",
      nodeId: "a",
      nodeName: "API Call",
      message: "GET https://api.example.com",
      level: "info",
    });

    useExecutionStore.getState().addLog({
      timestamp: "14:02:32",
      nodeId: "a",
      nodeName: "API Call",
      message: "응답 200 (150ms)",
      level: "success",
    });

    const logs = useExecutionStore.getState().logs;
    expect(logs).toHaveLength(2);
    expect(logs[0].level).toBe("info");
    expect(logs[1].level).toBe("success");
  });

  it("실행 완료 시 isRunning이 false로 변경된다", () => {
    useExecutionStore.getState().startExecution("exec-1", ["a"]);
    expect(useExecutionStore.getState().isRunning).toBe(true);

    useExecutionStore.getState().finishExecution();
    expect(useExecutionStore.getState().isRunning).toBe(false);
  });

  it("실행 시작 시 이전 로그가 초기화된다", () => {
    useExecutionStore.getState().addLog({
      timestamp: "old",
      nodeId: "x",
      nodeName: "old",
      message: "이전 로그",
      level: "info",
    });

    useExecutionStore.getState().startExecution("exec-2", ["a"]);
    expect(useExecutionStore.getState().logs).toHaveLength(0);
  });
});
