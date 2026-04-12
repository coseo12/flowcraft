import { create } from "zustand";

export type BottomTab = "log" | "settings" | "result";
export type ViewportMode = "flow" | "result" | "history";

export interface UIState {
  // 선택된 노드
  selectedNodeId: string | null;

  // 하단 패널 탭
  bottomTab: BottomTab;

  // 3D 뷰포트 모드
  viewportMode: ViewportMode;

  // 액션
  selectNode: (nodeId: string | null) => void;
  setBottomTab: (tab: BottomTab) => void;
  setViewportMode: (mode: ViewportMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedNodeId: null,
  bottomTab: "log",
  viewportMode: "flow",

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setBottomTab: (tab) => set({ bottomTab: tab }),
  setViewportMode: (mode) => set({ viewportMode: mode }),
}));
