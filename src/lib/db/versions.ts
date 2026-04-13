import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { updateWorkflow } from "./database";

export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version: number;
  graph: string;
  created_at: string;
}

/**
 * 워크플로우 버전 스냅샷 생성
 */
export function createVersion(
  db: Database.Database,
  workflowId: string,
  graph: string
): string {
  const id = uuidv4();

  // 현재 최대 버전 번호 조회
  const row = db
    .prepare(
      "SELECT COALESCE(MAX(version), 0) as max_version FROM workflow_versions WHERE workflow_id = ?"
    )
    .get(workflowId) as { max_version: number };

  const version = row.max_version + 1;

  db.prepare(
    "INSERT INTO workflow_versions (id, workflow_id, version, graph) VALUES (?, ?, ?, ?)"
  ).run(id, workflowId, version, graph);

  return id;
}

/**
 * 워크플로우의 버전 목록 조회 (최신순)
 */
export function getVersions(
  db: Database.Database,
  workflowId: string
): WorkflowVersion[] {
  return db
    .prepare(
      "SELECT * FROM workflow_versions WHERE workflow_id = ? ORDER BY version DESC"
    )
    .all(workflowId) as WorkflowVersion[];
}

/**
 * 특정 버전 조회
 */
export function getVersion(
  db: Database.Database,
  versionId: string
): WorkflowVersion | null {
  const row = db
    .prepare("SELECT * FROM workflow_versions WHERE id = ?")
    .get(versionId);
  return (row as WorkflowVersion) ?? null;
}

/**
 * 특정 버전으로 롤백
 */
export function rollbackToVersion(
  db: Database.Database,
  workflowId: string,
  versionId: string
): void {
  const version = getVersion(db, versionId);
  if (!version) throw new Error("버전을 찾을 수 없습니다");

  updateWorkflow(db, workflowId, { graph: version.graph });
}
