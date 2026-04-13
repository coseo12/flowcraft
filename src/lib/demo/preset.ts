import { type Node, type Edge } from "@xyflow/react";

/**
 * 데모용 워크플로우 프리셋
 *
 * 시나리오: 사용자 데이터를 생성하고, 조건에 따라 분기하여
 * 성공 경로는 3D 차트로 시각화, 실패 경로는 로그로 출력한다.
 */

export const DEMO_NODES: Node[] = [
  // 시작
  {
    id: "trigger",
    type: "httpTrigger",
    position: { x: 50, y: 200 },
    data: { label: "시작", nodeType: "httpTrigger" },
  },
  // 데이터 생성
  {
    id: "generate",
    type: "script",
    position: { x: 280, y: 200 },
    data: {
      label: "데이터 생성",
      nodeType: "script",
      code: `return {
  status: 200,
  users: [
    { name: "김철수", score: 85 },
    { name: "이영희", score: 92 },
    { name: "박민수", score: 78 },
    { name: "최지은", score: 95 },
    { name: "홍길동", score: 88 }
  ]
};`,
    },
  },
  // 조건 분기
  {
    id: "check",
    type: "condition",
    position: { x: 520, y: 200 },
    data: {
      label: "상태 확인",
      nodeType: "condition",
      field: "input.status",
      operator: "==",
      value: "200",
    },
  },
  // 성공 경로: 필터링
  {
    id: "filter",
    type: "script",
    position: { x: 760, y: 100 },
    data: {
      label: "90점 이상 필터",
      nodeType: "script",
      code: `const top = input.users.filter(u => u.score >= 90);
return top.map(u => ({ label: u.name, value: u.score }));`,
    },
  },
  // 성공 경로: 3D 차트
  {
    id: "chart",
    type: "logOutput",
    position: { x: 1000, y: 100 },
    data: {
      label: "우수 학생 결과",
      nodeType: "logOutput",
      logLabel: "90점 이상 학생",
    },
  },
  // 실패 경로: 로그
  {
    id: "error-log",
    type: "logOutput",
    position: { x: 760, y: 320 },
    data: {
      label: "에러 로그",
      nodeType: "logOutput",
      logLabel: "API 호출 실패",
    },
  },
];

export const DEMO_EDGES: Edge[] = [
  {
    id: "e-trigger-generate",
    source: "trigger",
    target: "generate",
    sourceHandle: null,
  },
  {
    id: "e-generate-check",
    source: "generate",
    target: "check",
    sourceHandle: null,
  },
  {
    id: "e-check-filter",
    source: "check",
    target: "filter",
    sourceHandle: "true",
  },
  {
    id: "e-check-error",
    source: "check",
    target: "error-log",
    sourceHandle: "false",
  },
  {
    id: "e-filter-chart",
    source: "filter",
    target: "chart",
    sourceHandle: null,
  },
];

export const DEMO_WORKFLOW_NAME = "데모: 학생 성적 분석";
