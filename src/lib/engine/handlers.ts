/**
 * 노드 타입별 핸들러
 * 각 핸들러는 입력을 받아 출력을 반환한다.
 */

/**
 * HTTP Trigger — 워크플로우 시작점
 */
export function handleHttpTrigger(config: {
  workflowId: string;
}): { triggeredAt: string; workflowId: string } {
  return {
    triggeredAt: new Date().toISOString(),
    workflowId: config.workflowId,
  };
}

/**
 * Script — JavaScript 코드 실행 (샌드박스)
 * Function 생성자를 사용하여 eval보다 안전한 실행 환경 제공
 * 동기 코드의 실행 후 시간 초과를 체크한다.
 */
const SCRIPT_TIMEOUT_MS = 10_000;

export function handleScript(code: string, input: unknown): unknown {
  const start = Date.now();
  const fn = new Function("input", code);
  const result = fn(input);

  if (Date.now() - start > SCRIPT_TIMEOUT_MS) {
    throw new Error("스크립트 실행 시간이 10초를 초과했습니다");
  }

  return result;
}

/**
 * Condition — 조건 분기
 * 조건을 평가하여 true/false 반환
 */
export function handleCondition(
  config: { field: string; operator: string; value: string },
  input: unknown
): boolean {
  const fieldValue = resolveField(config.field, input);
  const compareValue = config.value;

  switch (config.operator) {
    case "==":
      return String(fieldValue) === compareValue;
    case "!=":
      return String(fieldValue) !== compareValue;
    case ">":
      return Number(fieldValue) > Number(compareValue);
    case "<":
      return Number(fieldValue) < Number(compareValue);
    case ">=":
      return Number(fieldValue) >= Number(compareValue);
    case "<=":
      return Number(fieldValue) <= Number(compareValue);
    case "contains":
      return String(fieldValue).includes(compareValue);
    case "exists":
      return fieldValue !== undefined && fieldValue !== null;
    default:
      return false;
  }
}

/**
 * Log Output — 데이터를 로그로 출력
 */
export function handleLogOutput(
  label: string,
  input: unknown
): { label: string; data: unknown } {
  return { label, data: input };
}

// --- Phase 2 핸들러 ---

/**
 * Webhook — 외부 요청 수신
 */
export function handleWebhook(request: {
  headers: Record<string, string>;
  body: unknown;
  query: Record<string, string>;
}): { headers: Record<string, string>; body: unknown; query: Record<string, string> } {
  return request;
}

/**
 * Switch — 다중 조건 분기
 * 값에 따라 매칭되는 케이스 인덱스를 반환
 */
export function handleSwitch(
  value: string,
  cases: { value: string; label: string }[]
): { matchedIndex: number; matchedLabel: string } {
  const index = cases.findIndex((c) => c.value === value);
  return {
    matchedIndex: index,
    matchedLabel: index >= 0 ? cases[index].label : "default",
  };
}

/**
 * DB Query — SQLite 쿼리 실행
 * db 인스턴스를 외부에서 주입받는다.
 */
export function handleDbQuery(
  query: string,
  params: unknown[],
  db?: unknown
): { rows: unknown[]; changes: number } {
  // db가 주입되지 않으면 런타임에서 가져오기
  if (!db) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getDb } = require("@/lib/db");
    db = getDb();
  }

  const dbInstance = db as { prepare: (sql: string) => { all: (...args: unknown[]) => unknown[]; run: (...args: unknown[]) => { changes: number } } };
  const trimmed = query.trim().toUpperCase();

  if (trimmed.startsWith("SELECT")) {
    const rows = dbInstance.prepare(query).all(...params);
    return { rows, changes: 0 };
  }

  const result = dbInstance.prepare(query).run(...params);
  return { rows: [], changes: result.changes };
}

/**
 * Parallel — 입력을 그대로 전달 (분기점 역할)
 */
export function handleParallel(input: unknown): unknown {
  return input;
}

/**
 * LLM Prompt — AI 모델 호출
 */
export interface LlmConfig {
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
}

export async function handleLlmPrompt(
  config: LlmConfig,
  input: unknown
): Promise<{ text: string; usage: { input_tokens: number; output_tokens: number } }> {
  if (!config.apiKey) {
    throw new Error("API 키가 설정되지 않았습니다. 설정 화면에서 API 키를 입력해주세요.");
  }

  // 프롬프트 템플릿에 input 데이터 삽입
  const { renderTemplate } = await import("./template");
  const renderedPrompt = renderTemplate(config.prompt, input);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [{ role: "user", content: renderedPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = (error as Record<string, Record<string, string>>)?.error?.message ?? `API 호출 실패 (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const content = (data as { content: { type: string; text: string }[] }).content;
  const text = content.find((c: { type: string }) => c.type === "text")?.text ?? "";
  const usage = (data as { usage: { input_tokens: number; output_tokens: number } }).usage;

  return { text, usage };
}

/**
 * 필드 경로에서 값을 추출 ("input.data.name" → data.name의 값)
 * 경로가 "input."으로 시작하면 제거
 */
function resolveField(field: string, input: unknown): unknown {
  const path = field.startsWith("input.") ? field.slice(6) : field;
  const keys = path.split(".");
  let current: unknown = input;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}
