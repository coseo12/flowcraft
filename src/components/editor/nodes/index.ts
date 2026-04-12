import { type NodeTypes } from "@xyflow/react";
import { HttpTriggerNode } from "./http-trigger-node";
import { ApiCallNode } from "./api-call-node";
import { ScriptNode } from "./script-node";
import { ConditionNode } from "./condition-node";
import { LogOutputNode } from "./log-output-node";

export const nodeTypes: NodeTypes = {
  httpTrigger: HttpTriggerNode,
  apiCall: ApiCallNode,
  script: ScriptNode,
  condition: ConditionNode,
  logOutput: LogOutputNode,
};
