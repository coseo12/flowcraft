"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { BaseNode } from "./base-node";

function HttpTriggerNodeInner({ id, data }: NodeProps) {
  return (
    <BaseNode
      id={id}
      data={data as never}
      inputs={false}
      outputs={[{ id: "default" }]}
      icon={<span>⚡</span>}
    >
      수동 실행 트리거
    </BaseNode>
  );
}

export const HttpTriggerNode = memo(HttpTriggerNodeInner);
