import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createWorkflow, getWorkflows } from "@/lib/db/database";

// GET /api/workflows — 목록 조회
export async function GET() {
  const db = getDb();
  const workflows = getWorkflows(db);
  return NextResponse.json(workflows);
}

// POST /api/workflows — 생성
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, graph } = body;

  if (!name) {
    return NextResponse.json(
      { error: "name은 필수입니다" },
      { status: 400 }
    );
  }

  const db = getDb();
  const id = createWorkflow(db, {
    name,
    description: description ?? "",
    graph: typeof graph === "string" ? graph : JSON.stringify(graph ?? {}),
  });

  return NextResponse.json({ id }, { status: 201 });
}
