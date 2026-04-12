import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "./ui-store";

/**
 * 기획서 화면 설계 기반 테스트 시나리오
 *
 * - 노드 선택/해제
 * - 하단 패널 탭 전환
 * - 3D 뷰포트 모드 전환
 */

describe("UIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      selectedNodeId: null,
      bottomTab: "log",
      viewportMode: "flow",
    });
  });

  it("초기 상태는 노드 미선택, 로그 탭, 흐름 모드다", () => {
    const state = useUIStore.getState();
    expect(state.selectedNodeId).toBeNull();
    expect(state.bottomTab).toBe("log");
    expect(state.viewportMode).toBe("flow");
  });

  it("노드를 선택할 수 있다", () => {
    useUIStore.getState().selectNode("node-1");
    expect(useUIStore.getState().selectedNodeId).toBe("node-1");
  });

  it("노드 선택을 해제할 수 있다(null)", () => {
    useUIStore.getState().selectNode("node-1");
    useUIStore.getState().selectNode(null);
    expect(useUIStore.getState().selectedNodeId).toBeNull();
  });

  it("하단 패널 탭을 전환할 수 있다", () => {
    useUIStore.getState().setBottomTab("settings");
    expect(useUIStore.getState().bottomTab).toBe("settings");

    useUIStore.getState().setBottomTab("result");
    expect(useUIStore.getState().bottomTab).toBe("result");
  });

  it("3D 뷰포트 모드를 전환할 수 있다", () => {
    useUIStore.getState().setViewportMode("result");
    expect(useUIStore.getState().viewportMode).toBe("result");
  });
});
