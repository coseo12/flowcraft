"use client";

import { memo, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { useExecutionStore, type NodeStatus } from "@/lib/store/execution-store";
import { useUIStore } from "@/lib/store/ui-store";
import { NODE_COLORS, type FlowNodeType } from "@/lib/nodes/types";

interface BaseNodeData {
  label: string;
  nodeType: FlowNodeType;
  [key: string]: unknown;
}

interface BaseNodeProps {
  id: string;
  data: Record<string, unknown>;
  // 입출력 핸들 설정
  inputs?: boolean;
  outputs?: { id: string; label?: string; position?: number }[];
  icon: ReactNode;
  children?: ReactNode;
}

// 상태별 테두리 스타일
const STATUS_STYLES: Record<NodeStatus, string> = {
  idle: "border-border",
  running: "border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]",
  success: "border-success shadow-[0_0_8px_rgba(34,197,94,0.3)]",
  error: "border-error shadow-[0_0_8px_rgba(239,68,68,0.3)]",
  skipped: "border-muted opacity-50",
};

function BaseNodeInner({
  id,
  data,
  inputs = true,
  outputs = [{ id: "default" }],
  icon,
  children,
}: BaseNodeProps) {
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const status = nodeState?.status ?? "idle";
  const isSelected = selectedNodeId === id;
  const color = NODE_COLORS[data.nodeType as FlowNodeType];

  return (
    <div
      className={`rounded-lg border-2 bg-surface min-w-[160px] transition-all duration-200 ${STATUS_STYLES[status]} ${
        isSelected ? "!border-accent ring-1 ring-accent/30" : ""
      }`}
    >
      {/* 헤더 */}
      <div
        className="flex items-center gap-2 rounded-t-md px-3 py-2"
        style={{ borderBottom: `2px solid ${color}` }}
      >
        <span className="text-sm" style={{ color }}>
          {icon}
        </span>
        <span className="text-xs font-medium text-foreground">
          {data.label as string}
        </span>
        {status === "running" && (
          <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        )}
      </div>

      {/* 콘텐츠 (선택적) */}
      {children && (
        <div className="px-3 py-2 text-[10px] text-muted">{children}</div>
      )}

      {/* 입력 핸들 */}
      {inputs && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !rounded-full !border-2 !border-surface !bg-muted"
        />
      )}

      {/* 출력 핸들 */}
      {outputs.map((output, i) => (
        <Handle
          key={output.id}
          id={output.id}
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !rounded-full !border-2 !border-surface !bg-muted"
          style={
            outputs.length > 1
              ? { top: `${((i + 1) / (outputs.length + 1)) * 100}%` }
              : undefined
          }
        >
          {output.label && (
            <span className="absolute right-[-35px] text-[9px] text-muted whitespace-nowrap">
              {output.label}
            </span>
          )}
        </Handle>
      ))}
    </div>
  );
}

export const BaseNode = memo(BaseNodeInner);
