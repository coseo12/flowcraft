import { describe, it, expect, beforeEach } from "vitest";
import { useWorkflowStore } from "./workflow-store";
import { type Node, type Edge } from "@xyflow/react";

/**
 * 기획서 F4. 워크플로우 관리 기반 테스트 시나리오
 *
 * - 워크플로우를 이름으로 저장하고 목록에서 불러오기
 * - 노드/엣지 추가, 삭제
 * - 노드 삭제 시 연결된 엣지도 함께 제거
 * - 워크플로우 초기화(reset)
 */

const createNode = (id: string, type: string = "default"): Node => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { label: id, nodeType: type },
});

const createEdge = (source: string, target: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
});

describe("WorkflowStore", () => {
  beforeEach(() => {
    useWorkflowStore.getState().reset();
  });

  it("초기 상태는 빈 워크플로우다", () => {
    const state = useWorkflowStore.getState();
    expect(state.id).toBeNull();
    expect(state.name).toBe("Untitled Workflow");
    expect(state.nodes).toHaveLength(0);
    expect(state.edges).toHaveLength(0);
  });

  it("워크플로우 이름을 변경할 수 있다", () => {
    useWorkflowStore.getState().setName("테스트 워크플로우");
    expect(useWorkflowStore.getState().name).toBe("테스트 워크플로우");
  });

  it("노드를 추가할 수 있다", () => {
    const node = createNode("node-1", "httpTrigger");
    useWorkflowStore.getState().addNode(node);
    expect(useWorkflowStore.getState().nodes).toHaveLength(1);
    expect(useWorkflowStore.getState().nodes[0].id).toBe("node-1");
  });

  it("노드를 삭제하면 연결된 엣지도 함께 제거된다", () => {
    const nodes = [
      createNode("a", "httpTrigger"),
      createNode("b", "apiCall"),
      createNode("c", "logOutput"),
    ];
    const edges = [createEdge("a", "b"), createEdge("b", "c")];

    useWorkflowStore.getState().setNodes(nodes);
    useWorkflowStore.getState().setEdges(edges);

    // 노드 b 삭제 → a-b, b-c 엣지 모두 제거
    useWorkflowStore.getState().removeNode("b");

    const state = useWorkflowStore.getState();
    expect(state.nodes).toHaveLength(2);
    expect(state.nodes.find((n) => n.id === "b")).toBeUndefined();
    expect(state.edges).toHaveLength(0);
  });

  it("setWorkflow로 전체 워크플로우를 한 번에 설정할 수 있다", () => {
    const nodes = [createNode("x")];
    const edges: Edge[] = [];

    useWorkflowStore.getState().setWorkflow("wf-1", "저장된 워크플로우", nodes, edges);

    const state = useWorkflowStore.getState();
    expect(state.id).toBe("wf-1");
    expect(state.name).toBe("저장된 워크플로우");
    expect(state.nodes).toHaveLength(1);
  });

  it("reset 호출 시 초기 상태로 돌아간다", () => {
    useWorkflowStore.getState().setName("변경됨");
    useWorkflowStore.getState().addNode(createNode("n1"));
    useWorkflowStore.getState().reset();

    const state = useWorkflowStore.getState();
    expect(state.id).toBeNull();
    expect(state.name).toBe("Untitled Workflow");
    expect(state.nodes).toHaveLength(0);
  });
});
