import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import {
  handleWebhook,
  handleSwitch,
  handleDbQuery,
  handleParallel,
} from "./handlers";

let testDb: Database.Database;

/**
 * Phase 2 노드 핸들러 테스트
 */

describe("handleWebhook", () => {
  it("요청 데이터를 출력으로 반환한다", () => {
    const result = handleWebhook({
      headers: { "content-type": "application/json" },
      body: { name: "test" },
      query: { page: "1" },
    });

    expect(result.headers["content-type"]).toBe("application/json");
    expect(result.body).toEqual({ name: "test" });
    expect(result.query).toEqual({ page: "1" });
  });
});

describe("handleSwitch", () => {
  it("매칭되는 조건의 인덱스를 반환한다", () => {
    const cases = [
      { value: "admin", label: "관리자" },
      { value: "user", label: "사용자" },
    ];
    const result = handleSwitch("admin", cases);
    expect(result.matchedIndex).toBe(0);
    expect(result.matchedLabel).toBe("관리자");
  });

  it("매칭되는 조건이 없으면 default(-1)를 반환한다", () => {
    const cases = [
      { value: "admin", label: "관리자" },
    ];
    const result = handleSwitch("guest", cases);
    expect(result.matchedIndex).toBe(-1);
    expect(result.matchedLabel).toBe("default");
  });
});

describe("handleDbQuery", () => {
  beforeAll(() => {
    testDb = new Database(":memory:");
  });

  afterAll(() => {
    testDb.close();
  });

  it("SELECT 쿼리 결과를 반환한다", () => {
    const result = handleDbQuery(
      "SELECT 1 + 1 as result",
      [],
      testDb
    );
    expect(result.rows).toEqual([{ result: 2 }]);
  });

  it("파라미터 바인딩이 동작한다", () => {
    handleDbQuery("CREATE TABLE IF NOT EXISTS test_items (id INTEGER, name TEXT)", [], testDb);
    handleDbQuery("INSERT INTO test_items VALUES (?, ?)", [1, "테스트"], testDb);
    const result = handleDbQuery("SELECT * FROM test_items WHERE id = ?", [1], testDb);
    expect(result.rows).toEqual([{ id: 1, name: "테스트" }]);
    handleDbQuery("DROP TABLE test_items", [], testDb);
  });
});

describe("handleParallel", () => {
  it("입력 데이터를 그대로 반환한다", () => {
    const input = { data: [1, 2, 3] };
    const result = handleParallel(input);
    expect(result).toEqual(input);
  });
});
