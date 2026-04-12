import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  createExecution,
  updateExecution,
  getExecution,
  createExecutionNode,
  updateExecutionNode,
} from "./database";
import Database from "better-sqlite3";

/**
 * 기획서 섹션 6. 데이터 모델 + 섹션 7. API 설계 기반
 *
 * - workflows CRUD
 * - executions 생성/조회/업데이트
 * - execution_nodes 기록
 */

let db: Database.Database;

describe("Database", () => {
  beforeEach(() => {
    db = new Database(":memory:");
    initDatabase(db);
  });

  afterEach(() => {
    db.close();
  });

  describe("workflows", () => {
    it("워크플로우를 생성하고 조회할 수 있다", () => {
      const id = createWorkflow(db, {
        name: "테스트",
        description: "설명",
        graph: JSON.stringify({ nodes: [], edges: [] }),
      });

      const workflow = getWorkflow(db, id);
      expect(workflow).not.toBeNull();
      expect(workflow!.name).toBe("테스트");
      expect(workflow!.description).toBe("설명");
    });

    it("워크플로우 목록을 조회할 수 있다", () => {
      createWorkflow(db, { name: "A", description: "", graph: "{}" });
      createWorkflow(db, { name: "B", description: "", graph: "{}" });

      const list = getWorkflows(db);
      expect(list).toHaveLength(2);
    });

    it("워크플로우를 수정할 수 있다", () => {
      const id = createWorkflow(db, { name: "원본", description: "", graph: "{}" });
      updateWorkflow(db, id, { name: "수정됨", graph: '{"nodes":[]}' });

      const workflow = getWorkflow(db, id);
      expect(workflow!.name).toBe("수정됨");
      expect(workflow!.graph).toBe('{"nodes":[]}');
    });

    it("워크플로우를 삭제할 수 있다", () => {
      const id = createWorkflow(db, { name: "삭제대상", description: "", graph: "{}" });
      deleteWorkflow(db, id);

      const workflow = getWorkflow(db, id);
      expect(workflow).toBeNull();
    });

    it("존재하지 않는 워크플로우를 조회하면 null을 반환한다", () => {
      expect(getWorkflow(db, "nonexistent")).toBeNull();
    });
  });

  describe("executions", () => {
    it("실행 기록을 생성하고 조회할 수 있다", () => {
      const wfId = createWorkflow(db, { name: "wf", description: "", graph: "{}" });
      const execId = createExecution(db, wfId);

      const exec = getExecution(db, execId);
      expect(exec).not.toBeNull();
      expect(exec!.workflow_id).toBe(wfId);
      expect(exec!.status).toBe("pending");
    });

    it("실행 상태를 업데이트할 수 있다", () => {
      const wfId = createWorkflow(db, { name: "wf", description: "", graph: "{}" });
      const execId = createExecution(db, wfId);

      updateExecution(db, execId, {
        status: "success",
        finished_at: new Date().toISOString(),
        duration_ms: 1200,
      });

      const exec = getExecution(db, execId);
      expect(exec!.status).toBe("success");
      expect(exec!.duration_ms).toBe(1200);
    });
  });

  describe("execution_nodes", () => {
    it("노드 실행 기록을 생성하고 업데이트할 수 있다", () => {
      const wfId = createWorkflow(db, { name: "wf", description: "", graph: "{}" });
      const execId = createExecution(db, wfId);

      const nodeExecId = createExecutionNode(db, {
        execution_id: execId,
        node_id: "node-1",
        node_type: "script",
      });

      updateExecutionNode(db, nodeExecId, {
        status: "success",
        output_data: JSON.stringify({ result: 42 }),
        duration_ms: 150,
      });

      const exec = getExecution(db, execId);
      expect(exec).not.toBeNull();
    });
  });
});
