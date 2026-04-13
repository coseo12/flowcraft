import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { initDatabase, createWorkflow, updateWorkflow } from "./database";
import {
  createVersion,
  getVersions,
  getVersion,
  rollbackToVersion,
} from "./versions";

/**
 * 워크플로우 버전 관리 테스트
 *
 * - 저장 시 버전 스냅샷 생성
 * - 버전 목록 조회
 * - 특정 버전으로 롤백
 */

let db: Database.Database;

describe("워크플로우 버전 관리", () => {
  beforeEach(() => {
    db = new Database(":memory:");
    initDatabase(db);
  });

  afterEach(() => {
    db.close();
  });

  it("버전을 생성하고 조회할 수 있다", () => {
    const wfId = createWorkflow(db, {
      name: "test",
      description: "",
      graph: '{"nodes":[],"edges":[]}',
    });

    const versionId = createVersion(db, wfId, '{"nodes":[],"edges":[]}');
    expect(versionId).toBeTruthy();

    const versions = getVersions(db, wfId);
    expect(versions).toHaveLength(1);
    expect(versions[0].version).toBe(1);
  });

  it("여러 버전을 순차적으로 생성하면 버전 번호가 증가한다", () => {
    const wfId = createWorkflow(db, {
      name: "test",
      description: "",
      graph: '{"v":1}',
    });

    createVersion(db, wfId, '{"v":1}');
    createVersion(db, wfId, '{"v":2}');
    createVersion(db, wfId, '{"v":3}');

    const versions = getVersions(db, wfId);
    expect(versions).toHaveLength(3);
    expect(versions[0].version).toBe(3);
    expect(versions[2].version).toBe(1);
  });

  it("특정 버전의 그래프 데이터를 조회할 수 있다", () => {
    const wfId = createWorkflow(db, {
      name: "test",
      description: "",
      graph: "{}",
    });

    const v1Id = createVersion(db, wfId, '{"version":"v1"}');
    const version = getVersion(db, v1Id);

    expect(version).not.toBeNull();
    expect(version!.graph).toBe('{"version":"v1"}');
  });

  it("특정 버전으로 롤백하면 워크플로우 그래프가 해당 버전으로 복원된다", () => {
    const wfId = createWorkflow(db, {
      name: "test",
      description: "",
      graph: '{"v":0}',
    });

    const v1Id = createVersion(db, wfId, '{"v":1}');
    createVersion(db, wfId, '{"v":2}');

    // v2 → v1으로 롤백
    updateWorkflow(db, wfId, { graph: '{"v":2}' });
    rollbackToVersion(db, wfId, v1Id);

    const row = db.prepare("SELECT graph FROM workflows WHERE id = ?").get(wfId) as { graph: string };
    expect(row.graph).toBe('{"v":1}');
  });
});
