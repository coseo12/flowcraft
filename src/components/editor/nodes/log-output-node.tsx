"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { BaseNode } from "./base-node";

function LogOutputNodeInner({ id, data }: NodeProps) {
  const label = (data.logLabel as string) || "로그";

  return (
    <BaseNode
      id={id}
      data={data as never}
      outputs={[]}
      icon={<span>📋</span>}
    >
      라벨: {label}
    </BaseNode>
  );
}

export const LogOutputNode = memo(LogOutputNodeInner);
