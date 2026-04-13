"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { BaseNode } from "./base-node";

function ConditionNodeInner({ id, data }: NodeProps) {
  const field = (data.field as string) || "";
  const operator = (data.operator as string) || "==";
  const value = (data.value as string) || "";

  return (
    <BaseNode
      id={id}
      data={data}
      outputs={[
        { id: "true", label: "true" },
        { id: "false", label: "false" },
      ]}
      icon={<span>🔀</span>}
    >
      {field ? (
        <span className="font-mono">
          {field} {operator} {value}
        </span>
      ) : (
        <span className="italic">조건 미설정</span>
      )}
    </BaseNode>
  );
}

export const ConditionNode = memo(ConditionNodeInner);
