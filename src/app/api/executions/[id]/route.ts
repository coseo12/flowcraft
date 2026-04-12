import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getExecution } from "@/lib/db/database";

type Params = { params: Promise<{ id: string }> };

// GET /api/executions/:id — 실행 결과 조회
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  const execution = getExecution(db, id);

  if (!execution) {
    return NextResponse.json(
      { error: "실행 기록을 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  // 노드별 실행 기록도 함께 조회
  const nodeResults = db
    .prepare("SELECT * FROM execution_nodes WHERE execution_id = ?")
    .all(id);

  return NextResponse.json({
    ...execution,
    nodes: nodeResults,
  });
}
