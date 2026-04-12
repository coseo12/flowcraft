"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useUIStore } from "@/lib/store/ui-store";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { build3DPositionMap } from "@/lib/engine/layout-3d";

/**
 * 2D에서 노드 선택 시 3D 카메라를 해당 노드로 부드럽게 이동시킨다.
 */
export function CameraFocus() {
  const { camera } = useThree();
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const nodes = useWorkflowStore((s) => s.nodes);
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const prevSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedNodeId || selectedNodeId === prevSelectedRef.current) return;
    prevSelectedRef.current = selectedNodeId;

    const positionMap = build3DPositionMap(nodes);
    const pos = positionMap.get(selectedNodeId);
    if (!pos) return;

    // 노드 위치에서 약간 떨어진 곳을 카메라 타겟으로 설정
    targetRef.current = new THREE.Vector3(
      pos[0] + 2,
      pos[1] + 1.5,
      pos[2] + 2
    );
  }, [selectedNodeId, nodes, camera]);

  useFrame((_, delta) => {
    if (!targetRef.current) return;

    // 카메라를 타겟 위치로 부드럽게 이동 (lerp)
    camera.position.lerp(targetRef.current, delta * 3);

    // 충분히 가까워지면 이동 중지
    if (camera.position.distanceTo(targetRef.current) < 0.05) {
      targetRef.current = null;
    }
  });

  return null;
}
