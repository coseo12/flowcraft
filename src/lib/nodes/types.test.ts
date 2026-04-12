import { describe, it, expect } from "vitest";
import {
  NODE_COLORS,
  NODE_CATEGORIES,
  DEFAULT_CONFIGS,
  type FlowNodeType,
} from "./types";

/**
 * 기획서 노드 상세 정의(섹션 3) 기반 테스트 시나리오
 *
 * - Phase 1 노드 5종이 모두 정의되어 있다
 * - 모든 노드에 색상이 할당되어 있다
 * - 모든 노드에 카테고리가 할당되어 있다
 * - 각 노드 타입별 기본 설정이 올바르다
 */

const PHASE1_NODES: FlowNodeType[] = [
  "httpTrigger",
  "apiCall",
  "script",
  "condition",
  "logOutput",
];

describe("노드 타입 정의", () => {
  it("Phase 1 노드 5종이 모두 색상을 가진다", () => {
    for (const nodeType of PHASE1_NODES) {
      expect(NODE_COLORS[nodeType]).toBeDefined();
      // hex 색상 형식 검증
      expect(NODE_COLORS[nodeType]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("Phase 1 노드 5종이 모두 카테고리를 가진다", () => {
    for (const nodeType of PHASE1_NODES) {
      expect(NODE_CATEGORIES[nodeType]).toBeDefined();
    }
  });

  it("카테고리는 기획서에 정의된 4가지 중 하나다", () => {
    const validCategories = ["입력", "처리", "분기", "출력"];
    for (const nodeType of PHASE1_NODES) {
      expect(validCategories).toContain(NODE_CATEGORIES[nodeType]);
    }
  });

  it("모든 노드에 기본 설정값이 존재한다", () => {
    for (const nodeType of PHASE1_NODES) {
      expect(DEFAULT_CONFIGS[nodeType]).toBeDefined();
      expect(DEFAULT_CONFIGS[nodeType].nodeType).toBe(nodeType);
    }
  });
});

describe("API Call 노드 기본 설정", () => {
  const config = DEFAULT_CONFIGS["apiCall"];

  it("기본 Method는 GET이다", () => {
    expect("method" in config && config.method).toBe("GET");
  });

  it("기본 URL은 빈 문자열이다", () => {
    expect("url" in config && config.url).toBe("");
  });

  it("기본 타임아웃은 30초다", () => {
    expect("timeout" in config && config.timeout).toBe(30);
  });
});

describe("Script 노드 기본 설정", () => {
  const config = DEFAULT_CONFIGS["script"];

  it("기본 코드가 존재한다", () => {
    expect("code" in config && config.code).toContain("input");
  });
});

describe("Condition 노드 기본 설정", () => {
  const config = DEFAULT_CONFIGS["condition"];

  it("기본 연산자는 ==이다", () => {
    expect("operator" in config && config.operator).toBe("==");
  });
});

describe("LogOutput 노드 기본 설정", () => {
  const config = DEFAULT_CONFIGS["logOutput"];

  it("기본 로그 라벨이 존재한다", () => {
    expect("logLabel" in config && config.logLabel).toBe("로그");
  });
});
