import { NextRequest, NextResponse } from "next/server";
import { fetchMe } from "@/lib/mf-data";

export const GET = async (req: NextRequest) => {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ ok: false, error: "Bearer token required" }, { status: 401 });
    }
    const me = await fetchMe(token);
    return NextResponse.json({ ok: true, user: me });
  } catch (e) {
    const message = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
};
