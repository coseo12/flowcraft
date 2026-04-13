import { type Node, type Edge } from "@xyflow/react";
import { topologicalSort, detectCycle, getTargetsByHandle } from "./dag";
import {
  handleHttpTrigger,
  handleScript,
  handleCondition,
  handleLogOutput,
  handleWebhook,
  handleSwitch,
  handleDbQuery,
  handleParallel,
  handleLlmPrompt,
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
  // 완료된 노드 추적
  const completed = new Set<string>();

  // 레벨별 병렬 실행: 의존성이 충족된 노드들을 동시 실행
  const remaining = new Set(order);

  while (remaining.size > 0) {
    // 현재 실행 가능한 노드들 (모든 선행 노드가 완료됨)
    const ready: string[] = [];
    for (const nodeId of remaining) {
      const deps = edges
        .filter((e) => e.target === nodeId)
        .map((e) => e.source);
      if (deps.every((d) => completed.has(d) || skippedNodes.has(d))) {
        ready.push(nodeId);
      }
    }

    if (ready.length === 0) break;

    // 병렬 실행
    await Promise.all(
      ready.map(async (nodeId) => {
        remaining.delete(nodeId);

        const node = nodeMap.get(nodeId);
        if (!node) {
          completed.add(nodeId);
          return;
        }

        if (skippedNodes.has(nodeId)) {
          onStatusChange(nodeId, "skipped");
          completed.add(nodeId);
          return;
        }

        const input = collectInput(nodeId, edges, outputs);
        onStatusChange(nodeId, "running");

        try {
          const output = await executeNode(node, input, workflowId, edges);
          outputs.set(nodeId, output);
          onStatusChange(nodeId, "success", { output });

          // 조건/스위치 노드의 분기 처리
          handleBranching(node, output, edges, nodeId, skippedNodes, nodeMap);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          onStatusChange(nodeId, "error", { error: errorMessage });

          const targets = edges.filter((e) => e.source === nodeId).map((e) => e.target);
          for (const targetId of targets) {
            markDescendantsAsSkipped(targetId, edges, skippedNodes, nodeMap);
          }
        }

        completed.add(nodeId);
      })
    );
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

    case "webhook":
      return handleWebhook({
        headers: {},
        body: input,
        query: {},
      });

    case "cron":
      return {
        scheduledAt: new Date().toISOString(),
        expression: (data.expression as string) || "*/5 * * * *",
      };

    case "parallel":
      return handleParallel(input);

    case "switch": {
      const field = (data.field as string) || "";
      const casesStr = (data.cases as string) || "[]";
      let cases: { value: string; label: string }[] = [];
      try {
        cases = JSON.parse(casesStr);
      } catch {
        // 파싱 실패 시 빈 배열
      }
      const fieldPath = field.startsWith("input.") ? field.slice(6) : field;
      const keys = fieldPath.split(".");
      let val: unknown = input;
      for (const k of keys) {
        if (val && typeof val === "object") {
          val = (val as Record<string, unknown>)[k];
        } else {
          val = undefined;
          break;
        }
      }
      return handleSwitch(String(val ?? ""), cases);
    }

    case "dbQuery": {
      const query = renderTemplate((data.query as string) || "", input);
      let params: unknown[] = [];
      try {
        params = JSON.parse((data.params as string) || "[]");
      } catch {
        // 파싱 실패
      }
      return handleDbQuery(query, params);
    }

    case "llmPrompt":
      return handleLlmPrompt(
        {
          prompt: (data.prompt as string) || "",
          model: (data.model as string) || "claude-sonnet-4-20250514",
          temperature: (data.temperature as number) ?? 0.7,
          maxTokens: (data.maxTokens as number) || 1000,
          apiKey: (data.apiKey as string) || "",
        },
        input
      );

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
 * 조건/스위치 노드의 분기 처리
 */
function handleBranching(
  node: Node,
  output: unknown,
  edges: Edge[],
  nodeId: string,
  skippedNodes: Set<string>,
  nodeMap: Map<string, Node>
): void {
  const nodeType = node.data.nodeType as string;

  if (nodeType === "condition") {
    const conditionResult = output as boolean;
    const skippedHandle = conditionResult ? "false" : "true";
    const skippedTargets = getTargetsByHandle(edges, nodeId, skippedHandle);
    for (const targetId of skippedTargets) {
      markDescendantsAsSkipped(targetId, edges, skippedNodes, nodeMap);
    }
  }

  if (nodeType === "switch") {
    const result = output as { matchedIndex: number };
    const outEdges = edges.filter((e) => e.source === nodeId);
    for (const e of outEdges) {
      const handleIndex = e.sourceHandle === "default" ? -1 : Number(e.sourceHandle);
      if (handleIndex !== result.matchedIndex && !(result.matchedIndex === -1 && e.sourceHandle === "default")) {
        markDescendantsAsSkipped(e.target, edges, skippedNodes, nodeMap);
      }
    }
  }
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
