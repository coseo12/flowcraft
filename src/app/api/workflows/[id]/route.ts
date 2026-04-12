import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getWorkflow, updateWorkflow, deleteWorkflow } from "@/lib/db/database";

type Params = { params: Promise<{ id: string }> };

// GET /api/workflows/:id — 상세 조회
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  const workflow = getWorkflow(db, id);

  if (!workflow) {
    return NextResponse.json(
      { error: "워크플로우를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  return NextResponse.json(workflow);
}

// PUT /api/workflows/:id — 수정
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  const existing = getWorkflow(db, id);
  if (!existing) {
    return NextResponse.json(
      { error: "워크플로우를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  updateWorkflow(db, id, {
    name: body.name,
    description: body.description,
    graph: typeof body.graph === "string"
      ? body.graph
      : body.graph !== undefined
        ? JSON.stringify(body.graph)
        : undefined,
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/workflows/:id — 삭제
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();

  const existing = getWorkflow(db, id);
  if (!existing) {
    return NextResponse.json(
      { error: "워크플로우를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  deleteWorkflow(db, id);
  return NextResponse.json({ success: true });
}
