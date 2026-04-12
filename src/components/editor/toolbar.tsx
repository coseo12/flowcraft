"use client";

import { useWorkflowStore } from "@/lib/store/workflow-store";
import { useExecutionStore } from "@/lib/store/execution-store";

interface ToolbarProps {
  viewportOpen: boolean;
  onToggleViewport: () => void;
  bottomOpen: boolean;
  onToggleBottom: () => void;
  onSave?: () => void;
  onExecute?: () => void;
}

export function Toolbar({
  viewportOpen,
  onToggleViewport,
  bottomOpen,
  onToggleBottom,
  onSave,
  onExecute,
}: ToolbarProps) {
  const { name, setName } = useWorkflowStore();
  const { isRunning } = useExecutionStore();

  return (
    <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
      {/* 좌측: 로고 */}
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-accent">FlowCraft</span>
        <span className="text-sm text-muted">|</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent text-sm text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent px-1 py-0.5"
        />
      </div>

      {/* 우측: 액션 버튼 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleBottom}
          className={`rounded px-3 py-1.5 text-xs transition-colors ${
            bottomOpen
              ? "bg-surface-hover text-foreground"
              : "text-muted hover:text-foreground"
          }`}
          title="하단 패널 토글"
        >
          패널
        </button>
        <button
          onClick={onToggleViewport}
          className={`rounded px-3 py-1.5 text-xs transition-colors ${
            viewportOpen
              ? "bg-surface-hover text-foreground"
              : "text-muted hover:text-foreground"
          }`}
          title="3D 뷰포트 토글"
        >
          3D
        </button>
        <button
          onClick={onSave}
          className="rounded px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          저장
        </button>
        <button
          onClick={onExecute}
          disabled={isRunning}
          className="rounded bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? "실행 중..." : "실행"}
        </button>
      </div>
    </div>
  );
}
