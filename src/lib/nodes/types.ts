// 노드 타입 식별자
export type FlowNodeType =
  | "httpTrigger"
  | "apiCall"
  | "script"
  | "condition"
  | "logOutput";

// 노드 타입별 색상
export const NODE_COLORS: Record<FlowNodeType, string> = {
  httpTrigger: "#22c55e",
  apiCall: "#3b82f6",
  script: "#f59e0b",
  condition: "#a855f7",
  logOutput: "#f43f5e",
};

// 노드 타입별 카테고리
export const NODE_CATEGORIES: Record<FlowNodeType, string> = {
  httpTrigger: "입력",
  apiCall: "처리",
  script: "처리",
  condition: "분기",
  logOutput: "출력",
};

// 각 노드 타입별 설정 데이터
export interface HttpTriggerConfig {
  nodeType: "httpTrigger";
}

export interface ApiCallConfig {
  nodeType: "apiCall";
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: string;
  body: string;
  timeout: number;
}

export interface ScriptConfig {
  nodeType: "script";
  code: string;
}

export interface ConditionConfig {
  nodeType: "condition";
  field: string;
  operator: "==" | "!=" | ">" | "<" | ">=" | "<=" | "contains" | "exists";
  value: string;
}

export interface LogOutputConfig {
  nodeType: "logOutput";
  logLabel: string;
}

export type NodeConfig =
  | HttpTriggerConfig
  | ApiCallConfig
  | ScriptConfig
  | ConditionConfig
  | LogOutputConfig;

// 노드 타입별 기본 설정값
export const DEFAULT_CONFIGS: Record<FlowNodeType, NodeConfig> = {
  httpTrigger: { nodeType: "httpTrigger" },
  apiCall: {
    nodeType: "apiCall",
    url: "",
    method: "GET",
    headers: "{}",
    body: "{}",
    timeout: 30,
  },
  script: {
    nodeType: "script",
    code: "// input 변수로 이전 노드의 출력에 접근\nreturn input;",
  },
  condition: {
    nodeType: "condition",
    field: "input.status",
    operator: "==",
    value: "200",
  },
  logOutput: {
    nodeType: "logOutput",
    logLabel: "로그",
  },
};
