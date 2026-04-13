"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { useExecutionStore } from "@/lib/store/execution-store";

interface WorkflowListModalProps {
  open: boolean;
  onClose: () => void;
}

interface WorkflowItem {
  id: string;
  name: string;
  updated_at: string;
}

export function WorkflowListModal({ open, onClose }: WorkflowListModalProps) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { setWorkflow } = useWorkflowStore();
  const { reset: resetExecution } = useExecutionStore();

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/workflows");
    const data = await res.json();
    setWorkflows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) fetchWorkflows();
  }, [open, fetchWorkflows]);

  const handleLoad = async (id: string) => {
    const res = await fetch(`/api/workflows/${id}`);
    const data = await res.json();
    const graph = JSON.parse(data.graph);
    setWorkflow(data.id, data.name, graph.nodes ?? [], graph.edges ?? []);
    resetExecution();
    onClose();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    fetchWorkflows();
  };

  const handleExport = () => {
    const { id, name, nodes, edges } = useWorkflowStore.getState();
    const data = JSON.stringify({ id, name, nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "workflow"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        setWorkflow(null as unknown as string, data.name ?? "Imported", data.nodes ?? [], data.edges ?? []);
        resetExecution();
        onClose();
      } catch {
        alert("유효하지 않은 JSON 파일입니다");
      }
    };
    input.click();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[480px] max-h-[70vh] rounded-lg border border-border bg-surface shadow-xl flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-medium text-foreground">워크플로우 목록</span>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="rounded px-2 py-1 text-[10px] text-muted hover:text-foreground transition-colors"
            >
              가져오기
            </button>
            <button
              onClick={handleExport}
              className="rounded px-2 py-1 text-[10px] text-muted hover:text-foreground transition-colors"
            >
              내보내기
            </button>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-center text-xs text-muted">로딩...</div>
          ) : workflows.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted">
              저장된 워크플로우가 없습니다
            </div>
          ) : (
            workflows.map((wf) => (
              <div
                key={wf.id}
                className="flex items-center justify-between rounded px-3 py-2 hover:bg-surface-hover transition-colors"
              >
                <div>
                  <div className="text-xs text-foreground">{wf.name}</div>
                  <div className="text-[10px] text-muted">
                    {new Date(wf.updated_at).toLocaleString("ko-KR")}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleLoad(wf.id)}
                    className="rounded bg-accent px-2 py-1 text-[10px] text-white hover:bg-accent-hover transition-colors"
                  >
                    열기
                  </button>
                  <button
                    onClick={() => handleDelete(wf.id)}
                    className="rounded px-2 py-1 text-[10px] text-error hover:bg-surface-hover transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
