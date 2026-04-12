import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

// 테이블 생성
export function initDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      graph TEXT NOT NULL DEFAULT '{}',
      version INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      started_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT,
      duration_ms INTEGER,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS execution_nodes (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      node_type TEXT NOT NULL,
      status TEXT DEFAULT 'idle',
      input_data TEXT,
      output_data TEXT,
      error_message TEXT,
      started_at TEXT,
      finished_at TEXT,
      duration_ms INTEGER,
      FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
    );
  `);
}

// --- Workflows ---

export interface CreateWorkflowInput {
  name: string;
  description: string;
  graph: string;
}

export function createWorkflow(
  db: Database.Database,
  input: CreateWorkflowInput
): string {
  const id = uuidv4();
  db.prepare(
    "INSERT INTO workflows (id, name, description, graph) VALUES (?, ?, ?, ?)"
  ).run(id, input.name, input.description, input.graph);
  return id;
}

export function getWorkflows(
  db: Database.Database
): Record<string, unknown>[] {
  return db
    .prepare("SELECT * FROM workflows ORDER BY updated_at DESC")
    .all() as Record<string, unknown>[];
}

export function getWorkflow(
  db: Database.Database,
  id: string
): Record<string, unknown> | null {
  const row = db.prepare("SELECT * FROM workflows WHERE id = ?").get(id);
  return (row as Record<string, unknown>) ?? null;
}

export function updateWorkflow(
  db: Database.Database,
  id: string,
  input: Partial<{ name: string; description: string; graph: string }>
): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    fields.push("name = ?");
    values.push(input.name);
  }
  if (input.description !== undefined) {
    fields.push("description = ?");
    values.push(input.description);
  }
  if (input.graph !== undefined) {
    fields.push("graph = ?");
    values.push(input.graph);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE workflows SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
}

export function deleteWorkflow(db: Database.Database, id: string): void {
  db.prepare("DELETE FROM workflows WHERE id = ?").run(id);
}

// --- Executions ---

export function createExecution(
  db: Database.Database,
  workflowId: string
): string {
  const id = uuidv4();
  db.prepare(
    "INSERT INTO executions (id, workflow_id) VALUES (?, ?)"
  ).run(id, workflowId);
  return id;
}

export function updateExecution(
  db: Database.Database,
  id: string,
  input: Partial<{ status: string; finished_at: string; duration_ms: number }>
): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.status !== undefined) {
    fields.push("status = ?");
    values.push(input.status);
  }
  if (input.finished_at !== undefined) {
    fields.push("finished_at = ?");
    values.push(input.finished_at);
  }
  if (input.duration_ms !== undefined) {
    fields.push("duration_ms = ?");
    values.push(input.duration_ms);
  }

  if (fields.length === 0) return;
  values.push(id);

  db.prepare(`UPDATE executions SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
}

export function getExecution(
  db: Database.Database,
  id: string
): Record<string, unknown> | null {
  const row = db.prepare("SELECT * FROM executions WHERE id = ?").get(id);
  return (row as Record<string, unknown>) ?? null;
}

// --- Execution Nodes ---

export interface CreateExecutionNodeInput {
  execution_id: string;
  node_id: string;
  node_type: string;
}

export function createExecutionNode(
  db: Database.Database,
  input: CreateExecutionNodeInput
): string {
  const id = uuidv4();
  db.prepare(
    "INSERT INTO execution_nodes (id, execution_id, node_id, node_type) VALUES (?, ?, ?, ?)"
  ).run(id, input.execution_id, input.node_id, input.node_type);
  return id;
}

export function updateExecutionNode(
  db: Database.Database,
  id: string,
  input: Partial<{
    status: string;
    input_data: string;
    output_data: string;
    error_message: string;
    started_at: string;
    finished_at: string;
    duration_ms: number;
  }>
): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return;
  values.push(id);

  db.prepare(
    `UPDATE execution_nodes SET ${fields.join(", ")} WHERE id = ?`
  ).run(...values);
}
