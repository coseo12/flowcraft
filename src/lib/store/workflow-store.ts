import { create } from "zustand";
import { type Node, type Edge } from "@xyflow/react";

export interface WorkflowState {
  // 워크플로우 메타데이터
  id: string | null;
  name: string;

  // 노드/엣지
  nodes: Node[];
  edges: Edge[];

  // 액션
  setWorkflow: (id: string, name: string, nodes: Node[], edges: Edge[]) => void;
  setName: (name: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  id: null,
  name: "Untitled Workflow",
  nodes: [],
  edges: [],

  setWorkflow: (id, name, nodes, edges) => set({ id, name, nodes, edges }),
  setName: (name) => set({ name }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      // 연결된 엣지도 함께 제거
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
    })),
  reset: () => set({ id: null, name: "Untitled Workflow", nodes: [], edges: [] }),
}));
