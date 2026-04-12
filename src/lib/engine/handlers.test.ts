import { describe, it, expect, vi } from "vitest";
import {
  handleHttpTrigger,
  handleScript,
  handleCondition,
  handleLogOutput,
} from "./handlers";

/**
 * 기획서 섹션 3. 노드 상세 정의 기반 핸들러 테스트
 *
 * 각 노드 핸들러의 입출력 계약을 검증한다.
 * API Call 핸들러는 fetch 의존성이 있으므로 별도 테스트.
 */

describe("handleHttpTrigger", () => {
  it("triggeredAt과 workflowId를 포함한 출력을 반환한다", () => {
    const result = handleHttpTrigger({ workflowId: "wf-1" });

    expect(result).toHaveProperty("triggeredAt");
    expect(result.workflowId).toBe("wf-1");
    // triggeredAt은 ISO 문자열
    expect(() => new Date(result.triggeredAt)).not.toThrow();
  });
});

describe("handleScript", () => {
  it("JavaScript 코드를 실행하고 결과를 반환한다", () => {
    const code = "return { sum: input.a + input.b };";
    const input = { a: 2, b: 3 };

    const result = handleScript(code, input);
    expect(result).toEqual({ sum: 5 });
  });

  it("input 변수로 이전 노드의 출력에 접근할 수 있다", () => {
    const code = "return input.data.map(x => x * 2);";
    const input = { data: [1, 2, 3] };

    const result = handleScript(code, input);
    expect(result).toEqual([2, 4, 6]);
  });

  it("구문 에러가 있는 코드는 에러를 던진다", () => {
    const code = "return {{{";
    expect(() => handleScript(code, {})).toThrow();
  });

  it("런타임 에러가 있는 코드는 에러를 던진다", () => {
    const code = "return input.nonexistent.deep.value;";
    expect(() => handleScript(code, {})).toThrow();
  });
});

describe("handleCondition", () => {
  it("== 연산자로 같음을 비교한다", () => {
    const result = handleCondition(
      { field: "input.status", operator: "==", value: "200" },
      { status: 200 }
    );
    expect(result).toBe(true);
  });

  it("!= 연산자로 다름을 비교한다", () => {
    const result = handleCondition(
      { field: "input.status", operator: "!=", value: "200" },
      { status: 404 }
    );
    expect(result).toBe(true);
  });

  it("> 연산자로 초과를 비교한다", () => {
    const result = handleCondition(
      { field: "input.count", operator: ">", value: "5" },
      { count: 10 }
    );
    expect(result).toBe(true);
  });

  it("< 연산자로 미만을 비교한다", () => {
    const result = handleCondition(
      { field: "input.count", operator: "<", value: "5" },
      { count: 3 }
    );
    expect(result).toBe(true);
  });

  it(">= 연산자로 이상을 비교한다", () => {
    const result = handleCondition(
      { field: "input.count", operator: ">=", value: "5" },
      { count: 5 }
    );
    expect(result).toBe(true);
  });

  it("<= 연산자로 이하를 비교한다", () => {
    const result = handleCondition(
      { field: "input.count", operator: "<=", value: "5" },
      { count: 5 }
    );
    expect(result).toBe(true);
  });

  it("contains 연산자로 문자열 포함을 비교한다", () => {
    const result = handleCondition(
      { field: "input.message", operator: "contains", value: "hello" },
      { message: "say hello world" }
    );
    expect(result).toBe(true);
  });

  it("exists 연산자로 필드 존재를 확인한다", () => {
    expect(
      handleCondition(
        { field: "input.name", operator: "exists", value: "" },
        { name: "test" }
      )
    ).toBe(true);

    expect(
      handleCondition(
        { field: "input.name", operator: "exists", value: "" },
        {}
      )
    ).toBe(false);
  });

  it("중첩 필드에 접근할 수 있다", () => {
    const result = handleCondition(
      { field: "input.data.type", operator: "==", value: "user" },
      { data: { type: "user" } }
    );
    expect(result).toBe(true);
  });

  it("조건이 거짓이면 false를 반환한다", () => {
    const result = handleCondition(
      { field: "input.status", operator: "==", value: "200" },
      { status: 404 }
    );
    expect(result).toBe(false);
  });
});

describe("handleLogOutput", () => {
  it("입력 데이터를 그대로 반환한다", () => {
    const input = { users: [{ name: "홍길동" }] };
    const result = handleLogOutput("테스트 로그", input);

    expect(result.label).toBe("테스트 로그");
    expect(result.data).toEqual(input);
  });
});
