export const particleVertexShader = `
  attribute float aProgress;
  uniform float uTime;
  uniform float uSize;

  varying float vProgress;
  varying float vAlpha;

  void main() {
    vProgress = aProgress;

    // 진행도에 따라 크기 변화 — 중간이 가장 큼
    float sizeFactor = sin(vProgress * 3.14159) * 0.5 + 0.5;
    // 시간 기반 펄스
    float pulse = sin(uTime * 3.0 + vProgress * 6.28) * 0.3 + 0.7;

    vAlpha = sizeFactor * pulse;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * sizeFactor * pulse * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particleFragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    // 원형 파티클 — 중심에서 가장자리로 투명
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
