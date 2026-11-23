// app/api/coding/approvals/route.ts
//   GET  /api/coding/approvals?status=pending  -> the queue
//   POST /api/coding/approvals { id, approved, note? } -> answer a request

import { NextResponse } from "next/server";
import {
  getApproval,
  listApprovals,
  resolveApproval,
  type ApprovalStatus,
} from "@/app/lib/coding/approvals";

export const runtime = "nodejs";

const STATUSES: ApprovalStatus[] = ["pending", "approved", "denied", "expired"];

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const raw = url.searchParams.get("status");
  const status = STATUSES.find((entry) => entry === raw);

  return NextResponse.json({
    ok: true,
    approvals: listApprovals(status),
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: { id?: string; approved?: boolean; note?: string } = {};
  try {
    body = (await request.json()) as {
      id?: string;
      approved?: boolean;
      note?: string;
    };
  } catch {
    body = {};
  }

  if (!body.id) {
    return NextResponse.json(
      { ok: false, error: "An approval id is required." },
      { status: 400 },
    );
  }

  if (!getApproval(body.id)) {
    return NextResponse.json(
      { ok: false, error: `No approval request with id ${body.id}.` },
      { status: 404 },
    );
  }

  const resolved = resolveApproval(body.id, body.approved === true, body.note);
  return NextResponse.json({ ok: true, approval: resolved });
}