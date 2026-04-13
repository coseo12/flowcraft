"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { useExecutionStore } from "@/lib/store/execution-store";
import { useUIStore } from "@/lib/store/ui-store";
import { build3DPositionMap } from "@/lib/engine/layout-3d";
import { type FlowNodeType } from "@/lib/nodes/types";
import { Node3D } from "./node-3d";
import { Edge3D } from "./edge-3d";
import { ParticleFlow } from "./particle-flow";
import { CameraFocus } from "./camera-focus";
import { Chart3D } from "./chart-3d";

function Scene() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const isRunning = useExecutionStore((s) => s.isRunning);
  const nodeStates = useExecutionStore((s) => s.nodeStates);
  const viewportMode = useUIStore((s) => s.viewportMode);

  const positionMap = useMemo(() => build3DPositionMap(nodes), [nodes]);

  // 결과 모드: chart3d 노드의 출력 데이터를 수집
  const chartOutputs = useMemo(() => {
    if (viewportMode !== "result") return [];

    return nodes
      .filter((n) => n.data?.nodeType === "chart3d")
      .map((n) => {
        const state = nodeStates[n.id];
        const pos = positionMap.get(n.id) ?? [0, 0, 0] as [number, number, number];
        const output = state?.output as {
          chartType?: string;
          items?: { label: string; value: number }[];
        } | undefined;

        return {
          nodeId: n.id,
          position: pos,
          chartType: (output?.chartType ?? "bar") as "bar" | "pie",
          items: output?.items ?? [],
        };
      });
  }, [nodes, nodeStates, positionMap, viewportMode]);

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

      {/* 플레이스홀더 */}
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

      {/* 흐름 모드: 노드 + 엣지 + 파티클 */}
      {viewportMode === "flow" && (
        <>
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

          {edges.map((edge) => {
            const fromPos = positionMap.get(edge.source);
            const toPos = positionMap.get(edge.target);
            if (!fromPos || !toPos) return null;

            const sourceState = nodeStates[edge.source];
            const particleActive =
              isRunning &&
              (sourceState?.status === "running" ||
                sourceState?.status === "success");

            return (
              <group key={edge.id}>
                <Edge3D from={fromPos} to={toPos} />
                <ParticleFlow from={fromPos} to={toPos} active={particleActive} />
              </group>
            );
          })}
        </>
      )}

      {/* 결과 모드: 차트 렌더링 */}
      {viewportMode === "result" && (
        <>
          {/* 노드는 반투명으로 표시 */}
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

          {/* 차트 */}
          {chartOutputs.map((chart) => (
            <Chart3D
              key={chart.nodeId}
              items={chart.items}
              position={[chart.position[0], chart.position[1] + 1, chart.position[2]]}
              chartType={chart.chartType}
            />
          ))}
        </>
      )}
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
