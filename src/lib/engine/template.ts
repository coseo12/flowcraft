/**
 * {{input.field.path}} 패턴을 실제 값으로 치환하는 템플릿 엔진
 */
export function renderTemplate(template: string, data: unknown): string {
  return template.replace(/\{\{input\.([^}]+)\}\}/g, (_, path: string) => {
    const value = getNestedValue(data, path);
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

/**
 * 점(.) 구분 경로로 중첩 객체의 값에 접근
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}
