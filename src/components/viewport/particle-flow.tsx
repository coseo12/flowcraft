"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleFlowProps {
  from: [number, number, number];
  to: [number, number, number];
  active: boolean;
  color?: string;
}

const PARTICLE_COUNT = 8;

export function ParticleFlow({
  from,
  to,
  active,
  color = "#6366f1",
}: ParticleFlowProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.3,
      (from[2] + to[2]) / 2,
    ];

    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    );
  }, [from, to]);

  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

  useFrame(() => {
    if (!pointsRef.current || !active) return;

    const time = Date.now() * 0.001;
    const geometry = pointsRef.current.geometry;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = ((time * 0.5 + i / PARTICLE_COUNT) % 1);
      const point = curve.getPoint(t);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    geometry.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        color={color}
        size={0.06}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}
