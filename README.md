# FlowCraft

> **Demo**: https://flowcraft-jet.vercel.app/

노드 기반 워크플로우를 설계하고, 실행 흐름을 3D 공간에서 실시간으로 시각화하는 풀스택 웹 플랫폼.

## 개요

FlowCraft는 기존 워크플로우 도구(n8n, Zapier)의 텍스트 로그 기반 실행 결과를 넘어, **3D 파티클 애니메이션과 Bloom 이펙트**로 데이터 흐름을 직관적으로 보여줍니다.

2D 에디터에서 워크플로우를 설계하면, 3D 뷰포트에서 노드 간 데이터가 파티클로 이동하고, 실행 상태에 따라 노드가 발광합니다.

## 주요 기능

### 워크플로우 에디터

- 드래그앤드롭으로 노드 배치 및 연결
- 12종 노드 지원 (입력/처리/분기/AI/시각화/출력)
- 노드 클릭 시 설정 패널에서 즉시 편집
- 실행 상태에 따른 노드 색상/테두리 변화

### DAG 실행 엔진

- 토폴로지 정렬 기반 실행 순서 결정
- 사이클 감지로 순환 참조 방지
- 의존성 없는 노드의 병렬 실행 (Promise.all)
- 조건/스위치 노드의 분기 처리
- SSE(Server-Sent Events)로 실시간 실행 상태 스트리밍

### 3D 시각화

- React Three Fiber 기반 3D 뷰포트
- 노드 타입별 지오메트리 구분 (cone, sphere, box, octahedron, cylinder)
- 커스텀 GLSL 셰이더 파티클 (크기/투명도 펄스, Additive 블렌딩)
- Bloom 포스트프로세싱으로 발광 효과
- 실행 중 노드 발광 애니메이션 + 파티클 흐름
- 흐름 모드 / 결과 모드 전환
- 2D 노드 선택 시 3D 카메라 자동 이동

### 워크플로우 관리

- SQLite 기반 워크플로우 저장/로드
- 버전 관리 (스냅샷 생성, 롤백)
- JSON 내보내기/가져오기
- 실행 기록 저장 및 조회

## 노드 목록

| 카테고리 | 노드 | 설명 |
|---------|------|------|
| 입력 | HTTP Trigger | 수동 실행 트리거 |
| 입력 | Webhook | 외부 HTTP 요청 수신 |
| 입력 | Cron | 스케줄 기반 트리거 |
| 처리 | API Call | 외부 REST API 호출 |
| 처리 | Script | JavaScript 코드 실행 |
| 처리 | DB Query | SQLite 쿼리 실행 |
| 분기 | 조건문 | If/Else 흐름 분기 |
| 분기 | 스위치 | 다중 조건 분기 |
| 분기 | 병렬 | 동시 실행 분기 |
| AI | LLM Prompt | Anthropic API 기반 AI 호출 |
| 시각화 | 3D 차트 | 데이터를 3D 바 차트로 렌더링 |
| 출력 | 로그 출력 | 데이터를 로그 패널에 출력 |

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 2D 에디터 | React Flow (@xyflow/react) |
| 3D 뷰포트 | React Three Fiber + Drei |
| 셰이더 | GLSL (커스텀 파티클) |
| 포스트프로세싱 | @react-three/postprocessing (Bloom) |
| 상태 관리 | Zustand |
| DB | SQLite (better-sqlite3) |
| 실시간 통신 | SSE (Server-Sent Events) |
| 스타일 | Tailwind CSS v4 |
| 테스트 | Vitest + Testing Library |

## 시작하기

### 필수 조건

- Node.js 20 이상
- npm

### 설치 및 실행

```bash
git clone https://github.com/coseo12/flowcraft.git
cd flowcraft
npm install
npm run dev
```

http://localhost:3000 에서 에디터가 실행됩니다.

### 테스트

```bash
npm test
```

### 빌드

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t flowcraft .
docker run -p 3000:3000 flowcraft
```

## 아키텍처

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # REST API + SSE
│   │   ├── workflows/      # 워크플로우 CRUD + 실행
│   │   ├── executions/     # 실행 결과 조회
│   │   └── settings/       # API 키 설정
│   ├── landing/            # 랜딩 페이지
│   └── page.tsx            # 메인 에디터
│
├── components/
│   ├── editor/             # 2D 에디터
│   │   ├── canvas.tsx      # React Flow 캔버스
│   │   ├── nodes/          # 커스텀 노드 컴포넌트 5종
│   │   └── panels/         # 하단 패널 (로그/설정/결과)
│   └── viewport/           # 3D 뷰포트
│       ├── node-3d.tsx     # 3D 노드 (타입별 지오메트리)
│       ├── edge-3d.tsx     # 3D 엣지 (베지어 곡선)
│       ├── particle-flow.tsx # GLSL 파티클 시스템
│       ├── chart-3d.tsx    # 3D 바 차트
│       └── shaders/        # GLSL 셰이더
│
└── lib/
    ├── engine/             # DAG 실행 엔진
    │   ├── dag.ts          # 토폴로지 정렬, 사이클 감지
    │   ├── executor.ts     # 워크플로우 실행기 (병렬)
    │   ├── handlers.ts     # 노드 핸들러 12종
    │   └── template.ts     # {{input.field}} 템플릿 엔진
    ├── db/                 # SQLite 데이터 레이어
    └── store/              # Zustand 스토어 3개
```

## 외부 의존성

없음. LLM 노드는 선택 기능이며, 사용자가 설정 화면에서 본인의 Anthropic API 키를 입력하는 방식입니다.

## 라이선스

MIT
