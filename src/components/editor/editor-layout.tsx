"use client";

import { useState, useCallback } from "react";
import { Toolbar } from "./toolbar";
import { NodePalette } from "./node-palette";
import { FlowCanvas } from "./canvas";
import { BottomPanel } from "./panels/bottom-panel";
import { ViewportPanel } from "../viewport/viewport-panel";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { useExecutionStore } from "@/lib/store/execution-store";
import { useUIStore } from "@/lib/store/ui-store";
import { saveWorkflow, executeWorkflowApi } from "@/lib/api/workflow-api";
import { WorkflowListModal } from "./workflow-list-modal";

const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 800;

export function EditorLayout() {
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [viewportOpen, setViewportOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(400);
  const [listModalOpen, setListModalOpen] = useState(false);
  const { id: workflowId, name, nodes, edges, setWorkflow } = useWorkflowStore();
  const { startExecution, updateNodeStatus, addLog, finishExecution } = useExecutionStore();
  const { setBottomTab } = useUIStore();

  const handleSave = useCallback(async () => {
    const id = await saveWorkflow(workflowId, name, nodes, edges);
    if (!workflowId) {
      setWorkflow(id, name, nodes, edges);
    }
  }, [workflowId, name, nodes, edges, setWorkflow]);

  const handleExecute = useCallback(async () => {
    // 먼저 저장
    const id = await saveWorkflow(workflowId, name, nodes, edges);
    if (!workflowId) {
      setWorkflow(id, name, nodes, edges);
    }

    // 실행 시작
    const nodeIds = nodes.map((n) => n.id);
    startExecution(id, nodeIds);
    setBottomTab("log");

    executeWorkflowApi(
      id,
      (event, data) => {
        const d = data as Record<string, unknown>;
        const nodeId = d.nodeId as string;
        const timestamp = new Date().toLocaleTimeString();

        if (event === "node-status" || event === "node-complete" || event === "node-error") {
          updateNodeStatus(nodeId, {
            status: d.status as "running" | "success" | "error" | "skipped",
            output: d.output,
            error: d.error as string,
          });

          const node = nodes.find((n) => n.id === nodeId);
          const nodeName = (node?.data?.label as string) ?? nodeId;

          if (event === "node-status" && d.status === "running") {
            addLog({ timestamp, nodeId, nodeName, message: "실행 시작", level: "info" });
          } else if (event === "node-complete") {
            addLog({ timestamp, nodeId, nodeName, message: "완료", level: "success" });
          } else if (event === "node-error") {
            addLog({ timestamp, nodeId, nodeName, message: d.error as string, level: "error" });
          } else if (d.status === "skipped") {
            addLog({ timestamp, nodeId, nodeName, message: "건너뜀", level: "warn" });
          }
        }
      },
      () => {
        finishExecution();
      }
    );
  }, [workflowId, name, nodes, edges, setWorkflow, startExecution, updateNodeStatus, addLog, finishExecution, setBottomTab]);

  // 3D 뷰포트 리사이즈 핸들러
  const handleViewportResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = viewportWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = startX - moveEvent.clientX;
        const newWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, startWidth + delta));
        setViewportWidth(newWidth);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [viewportWidth]
  );

  return (
    <div className="flex h-full flex-col">
      {/* 상단 툴바 */}
      <Toolbar
        viewportOpen={viewportOpen}
        onToggleViewport={() => setViewportOpen(!viewportOpen)}
        bottomOpen={bottomOpen}
        onToggleBottom={() => setBottomOpen(!bottomOpen)}
        onSave={handleSave}
        onExecute={handleExecute}
        onOpenList={() => setListModalOpen(true)}
      />

      {/* 메인 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 노드 팔레트 (좌측) */}
        {paletteOpen && <NodePalette onClose={() => setPaletteOpen(false)} />}
        {!paletteOpen && (
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex w-10 items-center justify-center border-r border-border bg-surface text-muted hover:text-foreground"
            title="노드 팔레트 열기"
          >
            <span className="rotate-90 text-xs whitespace-nowrap">노드</span>
          </button>
        )}

        {/* 2D 에디터 (중앙) */}
        <div className="flex-1 relative">
          <FlowCanvas />
        </div>

        {/* 리사이즈 핸들 */}
        {viewportOpen && (
          <div
            onMouseDown={handleViewportResize}
            className="w-1 cursor-col-resize bg-border hover:bg-accent transition-colors"
          />
        )}

        {/* 3D 뷰포트 (우측) */}
        {viewportOpen && (
          <div style={{ width: viewportWidth }} className="flex-shrink-0">
            <ViewportPanel />
          </div>
        )}
      </div>

      {/* 하단 패널 */}
      {bottomOpen && <BottomPanel onClose={() => setBottomOpen(false)} />}

      {/* 워크플로우 목록 모달 */}
      <WorkflowListModal
        open={listModalOpen}
        onClose={() => setListModalOpen(false)}
      />
    </div>
  );
}
