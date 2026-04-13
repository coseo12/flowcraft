"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useUIStore, type ViewportMode } from "@/lib/store/ui-store";

const ViewportCanvas = dynamic(() => import("./viewport-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-muted">
      3D 뷰포트 로딩...
    </div>
  ),
});

const modes: { key: ViewportMode; label: string }[] = [
  { key: "flow", label: "흐름" },
  { key: "result", label: "결과" },
];

export function ViewportPanel() {
  const { viewportMode, setViewportMode } = useUIStore();

  return (
    <div className="relative h-full w-full bg-background">
      {/* 모드 전환 버튼 */}
      <div className="absolute top-2 left-2 z-10 flex gap-1 rounded bg-surface/80 p-1 backdrop-blur">
        {modes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setViewportMode(mode.key)}
            className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
              viewportMode === mode.key
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-xs text-muted">
            3D 뷰포트 로딩...
          </div>
        }
      >
        <ViewportCanvas />
      </Suspense>
    </div>
  );
}
