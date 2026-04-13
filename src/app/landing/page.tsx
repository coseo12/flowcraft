import Link from "next/link";

export const metadata = {
  title: "FlowCraft — 3D 비주얼 워크플로우 에디터",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* 히어로 */}
      <header className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-accent">FlowCraft</span>
        </h1>
        <p className="max-w-lg text-lg text-muted">
          노드 기반 워크플로우를 설계하고,
          실행 흐름을 3D 공간에서 실시간으로 시각화하세요.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          에디터 시작하기
        </Link>
      </header>

      {/* 기능 소개 */}
      <section className="mx-auto grid max-w-4xl gap-8 px-4 py-16 sm:grid-cols-3">
        <FeatureCard
          title="노드 기반 설계"
          description="드래그앤드롭으로 워크플로우를 시각적으로 설계합니다. 12종의 노드로 API 호출, 데이터 가공, AI 분석까지."
        />
        <FeatureCard
          title="실시간 3D 시각화"
          description="워크플로우 실행 흐름을 3D 파티클 애니메이션으로 확인합니다. Bloom 이펙트와 커스텀 셰이더."
        />
        <FeatureCard
          title="외부 의존 없음"
          description="npm run dev 하나로 즉시 실행. SQLite 파일 DB, 인메모리 DAG 엔진. Docker 단일 컨테이너 배포."
        />
      </section>

      {/* 기술 스택 */}
      <section className="border-t border-border px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-xl font-semibold">기술 스택</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Next.js",
              "TypeScript",
              "React Flow",
              "React Three Fiber",
              "Three.js",
              "GLSL",
              "Zustand",
              "SQLite",
              "SSE",
              "Tailwind CSS",
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted">
        FlowCraft — 3D 비주얼 워크플로우 에디터
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs leading-relaxed text-muted">{description}</p>
    </div>
  );
}
