import { describe, it, expect, vi } from "vitest";
import { handleLlmPrompt, type LlmConfig } from "./handlers";

/**
 * LLM Prompt 노드 핸들러 테스트
 *
 * - 프롬프트 템플릿에 input 데이터 삽입
 * - API 키 미설정 시 에러
 * - API 호출 실패 시 에러 전파
 */

describe("handleLlmPrompt", () => {
  it("API 키가 없으면 에러를 던진다", async () => {
    const config: LlmConfig = {
      prompt: "분석해줘: {{input.text}}",
      model: "claude-sonnet-4-20250514",
      temperature: 0.7,
      maxTokens: 1000,
      apiKey: "",
    };

    await expect(
      handleLlmPrompt(config, { text: "테스트" })
    ).rejects.toThrow("API 키가 설정되지 않았습니다");
  });

  it("프롬프트 템플릿에 input 데이터가 삽입된다", async () => {
    // fetch를 모킹하여 실제 API 호출 방지
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ type: "text", text: "분석 결과입니다" }],
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const config: LlmConfig = {
      prompt: "다음 텍스트를 분석해줘: {{input.text}}",
      model: "claude-sonnet-4-20250514",
      temperature: 0.7,
      maxTokens: 1000,
      apiKey: "test-key",
    };

    const result = await handleLlmPrompt(config, { text: "안녕하세요" });

    // fetch 호출 검증 — 프롬프트에 input이 삽입됨
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.messages[0].content).toContain("안녕하세요");

    expect(result.text).toBe("분석 결과입니다");
    expect(result.usage.input_tokens).toBe(10);

    vi.unstubAllGlobals();
  });

  it("API 호출 실패 시 에러를 던진다", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({
          error: { message: "Invalid API key" },
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const config: LlmConfig = {
      prompt: "테스트",
      model: "claude-sonnet-4-20250514",
      temperature: 0.7,
      maxTokens: 1000,
      apiKey: "invalid-key",
    };

    await expect(handleLlmPrompt(config, {})).rejects.toThrow();

    vi.unstubAllGlobals();
  });
});
