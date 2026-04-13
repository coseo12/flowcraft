import { NextRequest } from "next/server";
import { executeWorkflow } from "@/lib/engine/executor";
import { type Node, type Edge } from "@xyflow/react";

// POST /api/execute-local — DB 없이 직접 실행 + SSE
export async function POST(request: NextRequest) {
  const body = await request.json();
  const nodes: Node[] = body.nodes ?? [];
  const edges: Edge[] = body.edges ?? [];

  if (nodes.length === 0) {
    return new Response(
      JSON.stringify({ error: "실행할 노드가 없습니다" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      send("execution-start", { executionId: "local" });
      const startTime = Date.now();

      try {
        await executeWorkflow(nodes, edges, "local", (nodeId, status, data) => {
          const timestamp = new Date().toISOString();

          if (status === "running") {
            send("node-status", { nodeId, status, timestamp });
          } else if (status === "success") {
            send("node-complete", { nodeId, status, output: data?.output, timestamp });
          } else if (status === "error") {
            send("node-error", { nodeId, status, error: data?.error, timestamp });
          } else if (status === "skipped") {
            send("node-status", { nodeId, status, timestamp });
          }
        });

        send("execution-complete", {
          executionId: "local",
          status: "success",
          duration: Date.now() - startTime,
        });
      } catch (err) {
        send("execution-complete", {
          executionId: "local",
          status: "error",
          error: err instanceof Error ? err.message : String(err),
          duration: Date.now() - startTime,
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
