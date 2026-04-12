"use client";

import { useRef, useEffect } from "react";
import { useUIStore, type BottomTab } from "@/lib/store/ui-store";
import { useExecutionStore } from "@/lib/store/execution-store";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { NodeSettings } from "./node-settings";

interface BottomPanelProps {
  onClose: () => void;
}

const tabs: { key: BottomTab; label: string }[] = [
  { key: "log", label: "로그" },
  { key: "settings", label: "설정" },
  { key: "result", label: "결과" },
];

export function BottomPanel({ onClose }: BottomPanelProps) {
  const { bottomTab, setBottomTab, selectedNodeId } = useUIStore();
  const { logs, nodeStates } = useExecutionStore();
  const { nodes } = useWorkflowStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeState = selectedNodeId
    ? nodeStates[selectedNodeId]
    : null;

  // 로그 추가 시 자동 스크롤
  useEffect(() => {
    if (bottomTab === "log" && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs.length, bottomTab]);

  return (
    <div className="flex h-48 flex-col border-t border-border bg-surface">
      {/* 탭 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-2">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setBottomTab(tab.key)}
              className={`px-3 py-2 text-xs transition-colors ${
                bottomTab === tab.key
                  ? "border-b-2 border-accent text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.key === "log" && logs.length > 0 && (
                <span className="ml-1 text-[10px] text-muted">
                  ({logs.length})
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground text-xs px-2"
          title="패널 닫기"
        >
          ✕
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
        {bottomTab === "log" && (
          <div>
            {logs.length === 0 ? (
              <span className="text-muted">
                워크플로우를 실행하면 여기에 로그가 표시됩니다.
              </span>
            ) : (
              <>
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`py-0.5 ${
                      log.level === "error"
                        ? "text-error"
                        : log.level === "success"
                          ? "text-success"
                          : log.level === "warn"
                            ? "text-warning"
                            : "text-foreground"
                    }`}
                  >
                    <span className="text-muted">{log.timestamp}</span>{" "}
                    <span className="text-accent">[{log.nodeName}]</span>{" "}
                    {log.message}
                  </div>
                ))}
                <div ref={logEndRef} />
              </>
            )}
          </div>
        )}

        {bottomTab === "settings" && (
          <div>
            {selectedNode ? (
              <NodeSettings node={selectedNode} />
            ) : (
              <span className="text-muted">
                노드를 선택하면 여기에 설정이 표시됩니다.
              </span>
            )}
          </div>
        )}

        {bottomTab === "result" && (
          <div>
            {selectedNodeId ? (
              <div>
                <div className="mb-2 text-muted">
                  {selectedNode
                    ? (selectedNode.data.label as string)
                    : selectedNodeId}
                  {selectedNodeState && (
                    <span
                      className={`ml-2 ${
                        selectedNodeState.status === "success"
                          ? "text-success"
                          : selectedNodeState.status === "error"
                            ? "text-error"
                            : "text-muted"
                      }`}
                    >
                      [{selectedNodeState.status}]
                    </span>
                  )}
                </div>
                {selectedNodeState?.error && (
                  <div className="mb-2 text-error">
                    에러: {selectedNodeState.error}
                  </div>
                )}
                {selectedNodeState?.output ? (
                  <pre className="text-foreground whitespace-pre-wrap bg-background rounded p-2 border border-border">
                    {JSON.stringify(selectedNodeState.output, null, 2)}
                  </pre>
                ) : (
                  <span className="text-muted">
                    아직 실행 결과가 없습니다.
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted">
                노드를 선택하고 실행하면 결과가 표시됩니다.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
