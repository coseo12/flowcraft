import Database from "better-sqlite3";
import path from "path";
import { initDatabase } from "./database";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "flowcraft.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initDatabase(db);
  }
  return db;
}
