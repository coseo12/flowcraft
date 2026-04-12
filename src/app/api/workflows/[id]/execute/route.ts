import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import {
  getWorkflow,
  createExecution,
  updateExecution,
  createExecutionNode,
  updateExecutionNode,
} from "@/lib/db/database";
import { executeWorkflow } from "@/lib/engine/executor";
import { type Node, type Edge } from "@xyflow/react";

type Params = { params: Promise<{ id: string }> };

// POST /api/workflows/:id/execute — 실행 + SSE 스트리밍
export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  const workflow = getWorkflow(db, id);

  if (!workflow) {
    return new Response(
      JSON.stringify({ error: "워크플로우를 찾을 수 없습니다" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const graph = JSON.parse(workflow.graph as string);
  const nodes: Node[] = graph.nodes ?? [];
  const edges: Edge[] = graph.edges ?? [];

  if (nodes.length === 0) {
    return new Response(
      JSON.stringify({ error: "실행할 노드가 없습니다" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 실행 기록 생성
  const executionId = createExecution(db, id);
  updateExecution(db, executionId, { status: "running" });

  // 노드별 실행 기록 ID 매핑
  const nodeExecIds = new Map<string, string>();
  for (const node of nodes) {
    const nodeExecId = createExecutionNode(db, {
      execution_id: executionId,
      node_id: node.id,
      node_type: (node.data?.nodeType as string) ?? node.type ?? "unknown",
    });
    nodeExecIds.set(node.id, nodeExecId);
  }

  // SSE 스트림 생성
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      send("execution-start", { executionId });

      const startTime = Date.now();

      try {
        await executeWorkflow(
          nodes,
          edges,
          id,
          (nodeId, status, data) => {
            const timestamp = new Date().toISOString();
            const nodeExecId = nodeExecIds.get(nodeId);

            // DB에 노드 상태 기록
            if (nodeExecId) {
              const updateData: Record<string, unknown> = { status };
              if (status === "running") {
                updateData.started_at = timestamp;
              }
              if (status === "success" || status === "error" || status === "skipped") {
                updateData.finished_at = timestamp;
              }
              if (data?.output) {
                updateData.output_data = JSON.stringify(data.output);
              }
              if (data?.error) {
                updateData.error_message = data.error;
              }
              updateExecutionNode(db, nodeExecId, updateData);
            }

            // SSE로 상태 전송
            if (status === "running") {
              send("node-status", { nodeId, status, timestamp });
            } else if (status === "success") {
              send("node-complete", {
                nodeId,
                status,
                output: data?.output,
                timestamp,
              });
            } else if (status === "error") {
              send("node-error", {
                nodeId,
                status,
                error: data?.error,
                timestamp,
              });
            } else if (status === "skipped") {
              send("node-status", { nodeId, status, timestamp });
            }
          }
        );

        const duration = Date.now() - startTime;
        updateExecution(db, executionId, {
          status: "success",
          finished_at: new Date().toISOString(),
          duration_ms: duration,
        });

        send("execution-complete", {
          executionId,
          status: "success",
          duration,
        });
      } catch (err) {
        const duration = Date.now() - startTime;
        const errorMessage = err instanceof Error ? err.message : String(err);

        updateExecution(db, executionId, {
          status: "error",
          finished_at: new Date().toISOString(),
          duration_ms: duration,
        });

        send("execution-complete", {
          executionId,
          status: "error",
          error: errorMessage,
          duration,
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
