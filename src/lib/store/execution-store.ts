import { create } from "zustand";

export type NodeStatus = "idle" | "running" | "success" | "error" | "skipped";

export interface NodeExecutionState {
  status: NodeStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

export interface ExecutionState {
  // 현재 실행 상태
  executionId: string | null;
  isRunning: boolean;
  nodeStates: Record<string, NodeExecutionState>;

  // 로그
  logs: LogEntry[];

  // 액션
  startExecution: (executionId: string, nodeIds: string[]) => void;
  updateNodeStatus: (nodeId: string, state: Partial<NodeExecutionState>) => void;
  addLog: (entry: LogEntry) => void;
  finishExecution: () => void;
  reset: () => void;
}

export interface LogEntry {
  timestamp: string;
  nodeId: string;
  nodeName: string;
  message: string;
  level: "info" | "success" | "error" | "warn";
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  executionId: null,
  isRunning: false,
  nodeStates: {},
  logs: [],

  startExecution: (executionId, nodeIds) => {
    const nodeStates: Record<string, NodeExecutionState> = {};
    for (const id of nodeIds) {
      nodeStates[id] = { status: "idle" };
    }
    set({ executionId, isRunning: true, nodeStates, logs: [] });
  },

  updateNodeStatus: (nodeId, state) =>
    set((prev) => ({
      nodeStates: {
        ...prev.nodeStates,
        [nodeId]: { ...prev.nodeStates[nodeId], ...state },
      },
    })),

  addLog: (entry) =>
    set((prev) => ({ logs: [...prev.logs, entry] })),

  finishExecution: () => set({ isRunning: false }),

  reset: () =>
    set({ executionId: null, isRunning: false, nodeStates: {}, logs: [] }),
}));
