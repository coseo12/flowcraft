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
 */
export function handleScript(code: string, input: unknown): unknown {
  const fn = new Function("input", code);
  return fn(input);
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
