"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// R3F Canvas를 동적 임포트하여 SSR에서 제외
const ViewportCanvas = dynamic(() => import("./viewport-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-muted">
      3D 뷰포트 로딩...
    </div>
  ),
});

export function ViewportPanel() {
  return (
    <div className="h-full w-full bg-background">
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
