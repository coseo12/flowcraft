"use client";

import { useState } from "react";
import { NODE_COLORS, type FlowNodeType } from "@/lib/nodes/types";

interface NodePaletteProps {
  onClose: () => void;
}

interface NodeCategory {
  name: string;
  nodes: { type: FlowNodeType; label: string; description: string }[];
}

const NODE_CATEGORIES: NodeCategory[] = [
  {
    name: "입력",
    nodes: [
      {
        type: "httpTrigger",
        label: "HTTP Trigger",
        description: "워크플로우 실행 시작점",
      },
    ],
  },
  {
    name: "처리",
    nodes: [
      {
        type: "apiCall",
        label: "API Call",
        description: "외부 REST API 호출",
      },
      {
        type: "script",
        label: "Script",
        description: "JavaScript 코드 실행",
      },
    ],
  },
  {
    name: "분기",
    nodes: [
      {
        type: "condition",
        label: "조건문",
        description: "If/Else 흐름 분기",
      },
    ],
  },
  {
    name: "출력",
    nodes: [
      {
        type: "logOutput",
        label: "로그 출력",
        description: "데이터를 로그에 출력",
      },
    ],
  },
];

export function NodePalette({ onClose }: NodePaletteProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(NODE_CATEGORIES.map((c) => c.name))
  );

  const toggleCategory = (name: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const onDragStart = (
    event: React.DragEvent,
    nodeType: string,
    label: string
  ) => {
    event.dataTransfer.setData("application/flowcraft-node-type", nodeType);
    event.dataTransfer.setData("application/flowcraft-node-label", label);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex w-52 flex-col border-r border-border bg-surface">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted">노드</span>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground text-xs"
          title="팔레트 닫기"
        >
          ✕
        </button>
      </div>

      {/* 카테고리 목록 */}
      <div className="flex-1 overflow-y-auto p-2">
        {NODE_CATEGORIES.map((category) => (
          <div key={category.name} className="mb-2">
            <button
              onClick={() => toggleCategory(category.name)}
              className="flex w-full items-center gap-1 px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
            >
              <span
                className={`transition-transform ${
                  openCategories.has(category.name) ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
              {category.name}
            </button>

            {openCategories.has(category.name) && (
              <div className="mt-1 space-y-1">
                {category.nodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type, node.label)}
                    className="flex items-center gap-2 rounded px-2 py-1.5 cursor-grab active:cursor-grabbing hover:bg-surface-hover transition-colors"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: NODE_COLORS[node.type] }}
                    />
                    <div>
                      <div className="text-xs text-foreground">
                        {node.label}
                      </div>
                      <div className="text-[10px] text-muted">
                        {node.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
