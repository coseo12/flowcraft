"use client";

import { Text } from "@react-three/drei";

interface ChartItem {
  label: string;
  value: number;
}

interface Chart3DProps {
  items: ChartItem[];
  position: [number, number, number];
  chartType: "bar" | "pie";
}

const BAR_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6",
  "#a855f7", "#ec4899", "#14b8a6", "#f97316", "#06b6d4",
];

export function Chart3D({ items, position, chartType }: Chart3DProps) {
  if (items.length === 0) return null;

  if (chartType === "bar") {
    return <BarChart items={items} position={position} />;
  }

  // pie는 간략하게 바 차트로 대체 (원형 배치)
  return <BarChart items={items} position={position} />;
}

function BarChart({
  items,
  position,
}: {
  items: ChartItem[];
  position: [number, number, number];
}) {
  const maxValue = Math.max(...items.map((d) => d.value), 1);
  const barWidth = 0.15;
  const gap = 0.05;
  const totalWidth = items.length * (barWidth + gap) - gap;
  const startX = -totalWidth / 2;

  return (
    <group position={position}>
      {items.map((item, i) => {
        const height = (item.value / maxValue) * 1.5;
        const x = startX + i * (barWidth + gap) + barWidth / 2;
        const color = BAR_COLORS[i % BAR_COLORS.length];

        return (
          <group key={i}>
            {/* 바 */}
            <mesh position={[x, height / 2, 0]}>
              <boxGeometry args={[barWidth, height, barWidth]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.2}
              />
            </mesh>

            {/* 라벨 */}
            <Text
              position={[x, -0.15, 0]}
              fontSize={0.06}
              color="#e4e4e7"
              anchorX="center"
              anchorY="top"
              rotation={[0, 0, 0]}
            >
              {String(item.label)}
            </Text>

            {/* 값 */}
            <Text
              position={[x, height + 0.1, 0]}
              fontSize={0.06}
              color="#a1a1aa"
              anchorX="center"
              anchorY="bottom"
            >
              {String(item.value)}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
