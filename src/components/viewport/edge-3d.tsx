"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";

interface Edge3DProps {
  from: [number, number, number];
  to: [number, number, number];
}

export function Edge3D({ from, to }: Edge3DProps) {
  const points = useMemo(() => {
    // 중간에 살짝 위로 올라가는 곡선
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.3,
      (from[2] + to[2]) / 2,
    ];

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    );

    return curve.getPoints(20);
  }, [from, to]);

  return (
    <Line
      points={points}
      color="#6366f1"
      lineWidth={1.5}
      transparent
      opacity={0.4}
    />
  );
}
