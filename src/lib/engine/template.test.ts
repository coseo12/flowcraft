import { describe, it, expect } from "vitest";
import { renderTemplate } from "./template";

/**
 * 기획서 섹션 3.2 API Call 노드 — 템플릿 엔진
 *
 * - {{input.field}} 패턴을 실제 값으로 치환
 * - 중첩 필드 접근 (input.data.name)
 * - 존재하지 않는 필드는 빈 문자열로 치환
 * - 템플릿이 없으면 원본 문자열 그대로 반환
 */

describe("renderTemplate", () => {
  it("{{input.field}} 패턴을 실제 값으로 치환한다", () => {
    const template = "Hello, {{input.name}}!";
    const data = { name: "World" };

    expect(renderTemplate(template, data)).toBe("Hello, World!");
  });

  it("중첩 필드에 접근할 수 있다", () => {
    const template = "사용자: {{input.user.name}}, 이메일: {{input.user.email}}";
    const data = { user: { name: "홍길동", email: "hong@test.com" } };

    expect(renderTemplate(template, data)).toBe(
      "사용자: 홍길동, 이메일: hong@test.com"
    );
  });

  it("존재하지 않는 필드는 빈 문자열로 치환한다", () => {
    const template = "값: {{input.missing}}";
    const data = { name: "test" };

    expect(renderTemplate(template, data)).toBe("값: ");
  });

  it("템플릿 패턴이 없으면 원본을 그대로 반환한다", () => {
    const template = "일반 문자열";
    const data = { name: "test" };

    expect(renderTemplate(template, data)).toBe("일반 문자열");
  });

  it("여러 템플릿을 한 문자열에서 치환한다", () => {
    const template = "{{input.method}} {{input.url}}";
    const data = { method: "GET", url: "https://api.example.com" };

    expect(renderTemplate(template, data)).toBe("GET https://api.example.com");
  });

  it("숫자 값도 문자열로 치환한다", () => {
    const template = "상태: {{input.status}}";
    const data = { status: 200 };

    expect(renderTemplate(template, data)).toBe("상태: 200");
  });
});
