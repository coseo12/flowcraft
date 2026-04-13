import Database from "better-sqlite3";
import path from "path";
import { initDatabase } from "./database";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    try {
      const dbPath = path.join(process.cwd(), "flowcraft.db");
      db = new Database(dbPath);
      db.pragma("journal_mode = WAL");
      db.pragma("foreign_keys = ON");
    } catch {
      // 파일 DB 실패 시 인메모리로 폴백
      db = new Database(":memory:");
    }
    initDatabase(db);
  }
  return db;
}
