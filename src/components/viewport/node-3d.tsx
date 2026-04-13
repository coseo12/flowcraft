"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { type Mesh, Vector3 } from "three";
import { NODE_COLORS, type FlowNodeType } from "@/lib/nodes/types";
import { useExecutionStore, type NodeStatus } from "@/lib/store/execution-store";
import { useUIStore } from "@/lib/store/ui-store";

interface Node3DProps {
  id: string;
  label: string;
  nodeType: FlowNodeType;
  position: [number, number, number];
}

// 노드 타입별 지오메트리 매핑
const GEOMETRY_MAP: Record<FlowNodeType, "box" | "sphere" | "octahedron" | "cone" | "cylinder"> = {
  httpTrigger: "cone",
  apiCall: "sphere",
  script: "box",
  condition: "octahedron",
  logOutput: "cylinder",
  webhook: "cone",
  cron: "cone",
  parallel: "octahedron",
  switch: "octahedron",
  dbQuery: "cylinder",
};

// 상태별 emissive 강도
const STATUS_EMISSIVE: Record<NodeStatus, number> = {
  idle: 0.1,
  running: 0.8,
  success: 0.5,
  error: 0.6,
  skipped: 0.05,
};

// 상태별 emissive 색상 (null이면 노드 기본 색상 사용)
const STATUS_EMISSIVE_COLOR: Record<NodeStatus, string | null> = {
  idle: null,
  running: "#fbbf24",
  success: "#22c55e",
  error: "#ef4444",
  skipped: "#71717a",
};

export function Node3D({ id, label, nodeType, position }: Node3DProps) {
  const meshRef = useRef<Mesh>(null);
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const selectNode = useUIStore((s) => s.selectNode);
  const setBottomTab = useUIStore((s) => s.setBottomTab);

  const status = nodeState?.status ?? "idle";
  const isSelected = selectedNodeId === id;
  const color = NODE_COLORS[nodeType];
  const geometry = GEOMETRY_MAP[nodeType];
  const emissiveIntensity = STATUS_EMISSIVE[status];
  const emissiveColor = STATUS_EMISSIVE_COLOR[status] ?? color;

  // running 상태일 때 펄스 애니메이션
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (status === "running") {
      meshRef.current.rotation.y += delta * 2;
      const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
      meshRef.current.scale.setScalar(scale);
    } else {
      // 선택 시 살짝 확대
      const targetScale = isSelected ? 1.15 : 1;
      meshRef.current.scale.lerp(
        new Vector3(targetScale, targetScale, targetScale),
        delta * 5
      );
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={() => {
          selectNode(id);
          setBottomTab("settings");
        }}
      >
        {geometry === "box" && <boxGeometry args={[0.5, 0.5, 0.5]} />}
        {geometry === "sphere" && <sphereGeometry args={[0.3, 16, 16]} />}
        {geometry === "octahedron" && <octahedronGeometry args={[0.35, 0]} />}
        {geometry === "cone" && <coneGeometry args={[0.3, 0.5, 8]} />}
        {geometry === "cylinder" && <cylinderGeometry args={[0.25, 0.25, 0.4, 16]} />}
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={status === "skipped" ? 0.3 : 0.9}
        />
      </mesh>

      {/* 선택 링 */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.6} />
        </mesh>
      )}

      {/* 라벨 */}
      <Text
        position={[0, -0.55, 0]}
        fontSize={0.12}
        color="#e4e4e7"
        anchorX="center"
        anchorY="top"
      >
        {label}
      </Text>
    </group>
  );
}
