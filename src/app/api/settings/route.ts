import { NextRequest, NextResponse } from "next/server";

// 서버 메모리에 API 키 보관 (클라이언트에 노출하지 않음)
let storedApiKey = "";

// GET /api/settings — 설정 조회 (키는 마스킹)
export async function GET() {
  return NextResponse.json({
    hasApiKey: storedApiKey.length > 0,
    apiKeyPreview: storedApiKey
      ? `${storedApiKey.slice(0, 8)}...${storedApiKey.slice(-4)}`
      : "",
  });
}

// PUT /api/settings — 설정 업데이트
export async function PUT(request: NextRequest) {
  const body = await request.json();

  if (body.apiKey !== undefined) {
    storedApiKey = body.apiKey;
  }

  return NextResponse.json({ success: true });
}

// 서버 내부에서 API 키를 가져오는 함수
export function getApiKey(): string {
  return storedApiKey;
}
