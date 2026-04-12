"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { useExecutionStore } from "@/lib/store/execution-store";
import { build3DPositionMap } from "@/lib/engine/layout-3d";
import { type FlowNodeType } from "@/lib/nodes/types";
import { Node3D } from "./node-3d";
import { Edge3D } from "./edge-3d";
import { ParticleFlow } from "./particle-flow";
import { CameraFocus } from "./camera-focus";

function Scene() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const isRunning = useExecutionStore((s) => s.isRunning);
  const nodeStates = useExecutionStore((s) => s.nodeStates);

  // 2D → 3D 좌표 변환
  const positionMap = useMemo(() => build3DPositionMap(nodes), [nodes]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, 5, -10]} intensity={0.3} />
      <Stars radius={100} depth={50} count={3000} fade speed={1} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate={nodes.length === 0}
        autoRotateSpeed={0.3}
      />
      <CameraFocus />

      {/* 노드가 없으면 플레이스홀더 표시 */}
      {nodes.length === 0 && (
        <mesh>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color="#6366f1"
            emissive="#6366f1"
            emissiveIntensity={0.3}
            wireframe
          />
        </mesh>
      )}

      {/* 3D 노드 */}
      {nodes.map((node) => {
        const pos = positionMap.get(node.id);
        if (!pos) return null;

        return (
          <Node3D
            key={node.id}
            id={node.id}
            label={(node.data?.label as string) ?? node.id}
            nodeType={(node.data?.nodeType as FlowNodeType) ?? "script"}
            position={pos}
          />
        );
      })}

      {/* 3D 엣지 + 파티클 */}
      {edges.map((edge) => {
        const fromPos = positionMap.get(edge.source);
        const toPos = positionMap.get(edge.target);
        if (!fromPos || !toPos) return null;

        // 엣지의 소스 노드가 실행 중이거나 완료된 경우 파티클 활성화
        const sourceState = nodeStates[edge.source];
        const particleActive =
          isRunning &&
          (sourceState?.status === "running" ||
            sourceState?.status === "success");

        return (
          <group key={edge.id}>
            <Edge3D from={fromPos} to={toPos} />
            <ParticleFlow
              from={fromPos}
              to={toPos}
              active={particleActive}
            />
          </group>
        );
      })}
    </>
  );
}

export default function ViewportCanvas() {
  return (
    <Canvas
      camera={{ position: [3, 3, 3], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#0f0f13" }}
    >
      <Scene />
    </Canvas>
  );
}
