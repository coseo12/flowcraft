// 노드 타입 식별자
export type FlowNodeType =
  | "httpTrigger"
  | "apiCall"
  | "script"
  | "condition"
  | "logOutput"
  | "webhook"
  | "cron"
  | "parallel"
  | "switch"
  | "dbQuery"
  | "llmPrompt"
  | "chart3d";

// 노드 타입별 색상
export const NODE_COLORS: Record<FlowNodeType, string> = {
  httpTrigger: "#22c55e",
  apiCall: "#3b82f6",
  script: "#f59e0b",
  condition: "#a855f7",
  logOutput: "#f43f5e",
  webhook: "#10b981",
  cron: "#06b6d4",
  parallel: "#ec4899",
  switch: "#8b5cf6",
  dbQuery: "#14b8a6",
  llmPrompt: "#f97316",
  chart3d: "#06b6d4",
};

// 노드 타입별 카테고리
export const NODE_CATEGORIES: Record<FlowNodeType, string> = {
  httpTrigger: "입력",
  apiCall: "처리",
  script: "처리",
  condition: "분기",
  logOutput: "출력",
  webhook: "입력",
  cron: "입력",
  parallel: "분기",
  switch: "분기",
  dbQuery: "처리",
  llmPrompt: "AI",
  chart3d: "시각화",
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

export interface WebhookConfig {
  nodeType: "webhook";
  path: string;
  method: "GET" | "POST";
}

export interface CronConfig {
  nodeType: "cron";
  expression: string;
}

export interface ParallelConfig {
  nodeType: "parallel";
}

export interface SwitchConfig {
  nodeType: "switch";
  field: string;
  cases: string;
}

export interface DbQueryConfig {
  nodeType: "dbQuery";
  query: string;
  params: string;
}

export interface LlmPromptConfig {
  nodeType: "llmPrompt";
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface Chart3dConfig {
  nodeType: "chart3d";
  chartType: "bar" | "pie";
  labelField: string;
  valueField: string;
}

export type NodeConfig =
  | HttpTriggerConfig
  | ApiCallConfig
  | ScriptConfig
  | ConditionConfig
  | LogOutputConfig
  | WebhookConfig
  | CronConfig
  | ParallelConfig
  | SwitchConfig
  | DbQueryConfig
  | LlmPromptConfig
  | Chart3dConfig;

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
  webhook: {
    nodeType: "webhook",
    path: "/webhook",
    method: "POST",
  },
  cron: {
    nodeType: "cron",
    expression: "*/5 * * * *",
  },
  parallel: {
    nodeType: "parallel",
  },
  switch: {
    nodeType: "switch",
    field: "input.type",
    cases: '[{"value":"admin","label":"관리자"},{"value":"user","label":"사용자"}]',
  },
  dbQuery: {
    nodeType: "dbQuery",
    query: "SELECT * FROM workflows LIMIT 10",
    params: "[]",
  },
  llmPrompt: {
    nodeType: "llmPrompt",
    prompt: "다음 데이터를 분석해주세요:\n{{input.data}}",
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 1000,
  },
  chart3d: {
    nodeType: "chart3d",
    chartType: "bar",
    labelField: "label",
    valueField: "value",
  },
};
