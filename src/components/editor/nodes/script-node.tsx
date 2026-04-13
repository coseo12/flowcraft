"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { BaseNode } from "./base-node";

function ScriptNodeInner({ id, data }: NodeProps) {
  const code = (data.code as string) || "";
  // 코드 첫 줄만 미리보기로 표시
  const preview = code.split("\n").find((line) => !line.startsWith("//"))?.trim() || "코드 미작성";

  return (
    <BaseNode
      id={id}
      data={data}
      outputs={[{ id: "default" }]}
      icon={<span>📜</span>}
    >
      <span className="font-mono truncate max-w-[140px] inline-block">
        {preview}
      </span>
    </BaseNode>
  );
}

export const ScriptNode = memo(ScriptNodeInner);
