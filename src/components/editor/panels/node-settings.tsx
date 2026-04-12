"use client";

import { type Node } from "@xyflow/react";
import { useWorkflowStore } from "@/lib/store/workflow-store";

interface NodeSettingsProps {
  node: Node;
}

export function NodeSettings({ node }: NodeSettingsProps) {
  const { setNodes, nodes } = useWorkflowStore();

  // 노드 데이터 업데이트 헬퍼
  const updateData = (key: string, value: unknown) => {
    setNodes(
      nodes.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, [key]: value } } : n
      )
    );
  };

  const nodeType = node.data.nodeType as string;

  return (
    <div className="space-y-3">
      {/* 공통: 라벨 */}
      <Field label="노드 이름">
        <input
          type="text"
          value={node.data.label as string}
          onChange={(e) => updateData("label", e.target.value)}
          className="w-full rounded bg-background border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
        />
      </Field>

      {/* API Call 설정 */}
      {nodeType === "apiCall" && (
        <>
          <Field label="Method">
            <select
              value={(node.data.method as string) || "GET"}
              onChange={(e) => updateData("method", e.target.value)}
              className="w-full rounded bg-background border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </Field>
          <Field label="URL">
            <input
              type="text"
              value={(node.data.url as string) || ""}
              onChange={(e) => updateData("url", e.target.value)}
              placeholder="https://api.example.com/data"
              className="w-full rounded bg-background border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-accent font-mono"
            />
          </Field>
          <Field label="Headers (JSON)">
            <textarea
              value={(node.data.headers as string) || "{}"}
              onChange={(e) => updateData("headers", e.target.value)}
              rows={2}
              className="w-full rounded bg-background border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-accent font-mono resize-none"
            />
          </Field>
          {((node.data.method as string) === "POST" ||
            (node.data.method as string) === "PUT") && (
            <Field label="Body (JSON)">
              <textarea
                value={(node.data.body as string) || "{}"}
                onChange={(e) => updateData("body", e.target.value)}
                rows={3}
                className="w-full rounded bg-background border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-accent font-mono resize-none"
              />
            </Field>
          )}
          <Field label="타임아웃 (초)">
            <input
              type="number"
              value={(node.data.timeout as number) || 30}
              onChange={(e) => updateData("timeout", Number(e.target.value))}
              min={1}
              max={300}
              className="w-20 rounded bg-background border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
            />
          </Field>
        </>
      )}

      {/* Script 설정 */}
      {nodeType === "script" && (
        <Field label="JavaScript 코드">
          <textarea
            value={(node.data.code as string) || ""}
            onChange={(e) => updateData("code", e.target.value)}
            rows={6}
            placeholder="// input 변수로 이전 노드의 출력에 접근&#10;return input;"
            className="w-full rounded bg-background border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-accent font-mono resize-none"
          />
        </Field>
      )}

      {/* 조건문 설정 */}
      {nodeType === "condition" && (
        <>
          <Field label="필드 경로">
            <input
              type="text"
              value={(node.data.field as string) || ""}
              onChange={(e) => updateData("field", e.target.value)}
              placeholder="input.status"
              className="w-full rounded bg-background border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-accent font-mono"
            />
          </Field>
          <Field label="연산자">
            <select
              value={(node.data.operator as string) || "=="}
              onChange={(e) => updateData("operator", e.target.value)}
              className="w-full rounded bg-background border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
            >
              <option value="==">== (같음)</option>
              <option value="!=">!= (다름)</option>
              <option value=">">{">"} (초과)</option>
              <option value="<">{"<"} (미만)</option>
              <option value=">=">={">"}= (이상)</option>
              <option value="<=">{"<"}= (이하)</option>
              <option value="contains">contains (포함)</option>
              <option value="exists">exists (존재)</option>
            </select>
          </Field>
          <Field label="비교값">
            <input
              type="text"
              value={(node.data.value as string) || ""}
              onChange={(e) => updateData("value", e.target.value)}
              placeholder="200"
              className="w-full rounded bg-background border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-accent font-mono"
            />
          </Field>
        </>
      )}

      {/* 로그 출력 설정 */}
      {nodeType === "logOutput" && (
        <Field label="로그 라벨">
          <input
            type="text"
            value={(node.data.logLabel as string) || "로그"}
            onChange={(e) => updateData("logLabel", e.target.value)}
            className="w-full rounded bg-background border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
          />
        </Field>
      )}

      {/* HTTP Trigger — 설정 없음 */}
      {nodeType === "httpTrigger" && (
        <div className="text-muted text-[10px]">
          이 노드는 추가 설정이 없습니다.
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
