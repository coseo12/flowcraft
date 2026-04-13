"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { particleVertexShader, particleFragmentShader } from "./shaders/particle";

interface ParticleFlowProps {
  from: [number, number, number];
  to: [number, number, number];
  active: boolean;
  color?: string;
}

const PARTICLE_COUNT = 12;

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

  const { positions, progresses } = useMemo(() => {
    return {
      positions: new Float32Array(PARTICLE_COUNT * 3),
      progresses: new Float32Array(PARTICLE_COUNT),
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uSize: { value: 8 },
    }),
    [color]
  );

  useFrame((_, delta) => {
    if (!pointsRef.current || !active) return;

    uniforms.uTime.value += delta;
    const time = uniforms.uTime.value;
    const geometry = pointsRef.current.geometry;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = (time * 0.4 + i / PARTICLE_COUNT) % 1;
      const point = curve.getPoint(t);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      progresses[i] = t;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aProgress", new THREE.BufferAttribute(progresses, 1));
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aProgress.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
