import { type Node, type Edge } from "@xyflow/react";

/**
 * 워크플로우 저장
 * 이미 ID가 있으면 PUT, 없으면 POST
 */
export async function saveWorkflow(
  id: string | null,
  name: string,
  nodes: Node[],
  edges: Edge[]
): Promise<string> {
  const graph = JSON.stringify({ nodes, edges });

  if (id) {
    await fetch(`/api/workflows/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, graph }),
    });
    return id;
  }

  const res = await fetch("/api/workflows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, graph }),
  });

  const data = await res.json();
  return data.id;
}

/**
 * 워크플로우 실행 — SSE 이벤트를 콜백으로 전달
 */
export function executeWorkflowApi(
  workflowId: string,
  onEvent: (event: string, data: unknown) => void,
  onDone: () => void
): () => void {
  const controller = new AbortController();

  fetch(`/api/workflows/${workflowId}/execute`, {
    method: "POST",
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        onEvent("error", { error: "실행 요청 실패" });
        onDone();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onEvent(currentEvent, data);
            } catch {
              // JSON 파싱 실패 무시
            }
          }
        }
      }

      onDone();
    })
    .catch(() => {
      onDone();
    });

  // 취소 함수 반환
  return () => controller.abort();
}

/**
 * 로컬 실행 — DB 없이 노드/엣지를 직접 서버에 보내서 실행
 */
export function executeLocalApi(
  nodes: Node[],
  edges: Edge[],
  onEvent: (event: string, data: unknown) => void,
  onDone: () => void
): () => void {
  const controller = new AbortController();

  fetch("/api/execute-local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodes, edges }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        onEvent("error", { error: "실행 요청 실패" });
        onDone();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onEvent(currentEvent, data);
            } catch {
              // JSON 파싱 실패 무시
            }
          }
        }
      }

      onDone();
    })
    .catch(() => {
      onDone();
    });

  return () => controller.abort();
}
