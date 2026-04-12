"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { BaseNode } from "./base-node";

function ApiCallNodeInner({ id, data }: NodeProps) {
  const method = (data.method as string) || "GET";
  const url = (data.url as string) || "";

  return (
    <BaseNode
      id={id}
      data={data as never}
      outputs={[{ id: "default" }]}
      icon={<span>🌐</span>}
    >
      <span className="font-mono font-bold text-blue-400">{method}</span>{" "}
      {url ? (
        <span className="truncate max-w-[120px] inline-block align-bottom">
          {url}
        </span>
      ) : (
        <span className="italic">URL 미설정</span>
      )}
    </BaseNode>
  );
}

export const ApiCallNode = memo(ApiCallNodeInner);
