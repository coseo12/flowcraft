import { type Node, type Edge } from "@xyflow/react";
import { topologicalSort, detectCycle, getTargetsByHandle } from "./dag";
import {
  handleHttpTrigger,
  handleScript,
  handleCondition,
  handleLogOutput,
} from "./handlers";
import { renderTemplate } from "./template";

type StatusCallback = (
  nodeId: string,
  status: string,
  data?: { output?: unknown; error?: string }
) => void;

/**
 * 워크플로우를 실행한다.
 *
 * 1. 사이클 감지
 * 2. 토폴로지 정렬으로 실행 순서 결정
 * 3. 순서대로 각 노드 실행
 * 4. 조건 분기 시 해당 경로만 실행
 * 5. 실패 시 후속 노드 skipped 처리
 */
export async function executeWorkflow(
  nodes: Node[],
  edges: Edge[],
  workflowId: string,
  onStatusChange: StatusCallback
): Promise<void> {
  // 사이클 감지
  if (detectCycle(nodes, edges)) {
    throw new Error("워크플로우에 사이클이 존재합니다");
  }

  // 실행 순서 결정
  const order = topologicalSort(nodes, edges);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // 노드별 출력 데이터 저장
  const outputs = new Map<string, unknown>();
  // skipped된 노드 추적
  const skippedNodes = new Set<string>();

  for (const nodeId of order) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    // skipped 처리 확인
    if (skippedNodes.has(nodeId)) {
      onStatusChange(nodeId, "skipped");
      continue;
    }

    // 입력 데이터 수집 — 이전 연결된 노드들의 출력을 합침
    const input = collectInput(nodeId, edges, outputs);

    // 실행 시작
    onStatusChange(nodeId, "running");

    try {
      const output = await executeNode(node, input, workflowId, edges);
      outputs.set(nodeId, output);
      onStatusChange(nodeId, "success", { output });

      // 조건 노드의 분기 처리
      if (node.data.nodeType === "condition") {
        const conditionResult = output as boolean;
        const skippedHandle = conditionResult ? "false" : "true";

        // 해당 핸들의 타겟 노드와 그 하위를 모두 skipped 처리
        const skippedTargets = getTargetsByHandle(edges, nodeId, skippedHandle);
        for (const targetId of skippedTargets) {
          markDescendantsAsSkipped(targetId, edges, skippedNodes, nodeMap);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      onStatusChange(nodeId, "error", { error: errorMessage });

      // 실패한 노드의 모든 후속 노드를 skipped 처리
      const targets = edges.filter((e) => e.source === nodeId).map((e) => e.target);
      for (const targetId of targets) {
        markDescendantsAsSkipped(targetId, edges, skippedNodes, nodeMap);
      }
    }
  }
}

/**
 * 개별 노드를 실행하고 결과를 반환한다.
 */
async function executeNode(
  node: Node,
  input: unknown,
  workflowId: string,
  edges: Edge[]
): Promise<unknown> {
  const data = node.data as Record<string, unknown>;
  const nodeType = data.nodeType as string;

  switch (nodeType) {
    case "httpTrigger":
      return handleHttpTrigger({ workflowId });

    case "apiCall": {
      const url = renderTemplate((data.url as string) || "", input);
      const method = (data.method as string) || "GET";
      const timeout = (data.timeout as number) || 30;
      let headers: Record<string, string> = {};
      let body: string | undefined;

      try {
        headers = JSON.parse(
          renderTemplate((data.headers as string) || "{}", input)
        );
      } catch {
        // 파싱 실패 시 빈 헤더
      }

      if (method === "POST" || method === "PUT") {
        body = renderTemplate((data.body as string) || "{}", input);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body,
          signal: controller.signal,
        });

        const responseData = await response.json().catch(() => null);

        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    }

    case "script":
      return handleScript((data.code as string) || "return input;", input);

    case "condition":
      return handleCondition(
        {
          field: (data.field as string) || "",
          operator: (data.operator as string) || "==",
          value: (data.value as string) || "",
        },
        input
      );

    case "logOutput":
      return handleLogOutput((data.logLabel as string) || "로그", input);

    default:
      throw new Error(`알 수 없는 노드 타입: ${nodeType}`);
  }
}

/**
 * 노드의 입력 데이터를 수집한다.
 * 이전에 연결된 노드들의 출력을 합침.
 * 단일 입력이면 그대로, 다중 입력이면 병합.
 */
function collectInput(
  nodeId: string,
  edges: Edge[],
  outputs: Map<string, unknown>
): unknown {
  const sourceEdges = edges.filter((e) => e.target === nodeId);

  if (sourceEdges.length === 0) return {};
  if (sourceEdges.length === 1) return outputs.get(sourceEdges[0].source) ?? {};

  // 다중 입력 — 모든 소스 출력을 하나의 객체로 병합
  const merged: Record<string, unknown> = {};
  for (const e of sourceEdges) {
    const output = outputs.get(e.source);
    if (output && typeof output === "object") {
      Object.assign(merged, output);
    }
  }
  return merged;
}

/**
 * 특정 노드와 그 하위 모든 노드를 skipped로 표시
 */
function markDescendantsAsSkipped(
  nodeId: string,
  edges: Edge[],
  skippedNodes: Set<string>,
  nodeMap: Map<string, Node>
): void {
  if (skippedNodes.has(nodeId)) return;
  skippedNodes.add(nodeId);

  const children = edges.filter((e) => e.source === nodeId).map((e) => e.target);
  for (const childId of children) {
    markDescendantsAsSkipped(childId, edges, skippedNodes, nodeMap);
  }
}
