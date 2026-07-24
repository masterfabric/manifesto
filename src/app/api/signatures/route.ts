import { NextRequest, NextResponse } from "next/server";
import {
  fetchMe,
  fetchParticularSignatures,
  normalizePublicProfile,
  signParticularManifesto,
} from "@/lib/mf-data";

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get("limit") || "100");
    const data = await fetchParticularSignatures(Number.isFinite(limit) ? limit : 100);
    return NextResponse.json(data.signatures, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch signatures" },
      { status: 502 },
    );
  }
}

/**
 * Auth identity is mf-go only (`Authorization` → `me`).
 * Particular stores a public snapshot for the wall; it does not register users.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ error: "Bearer token required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      message?: string;
      location?: string;
      privacy_consent?: boolean;
    };

    if (body.privacy_consent !== true) {
      return NextResponse.json({ error: "Privacy consent is required" }, { status: 400 });
    }

    const me = await fetchMe(token);
    const profile = normalizePublicProfile({
      githubUsername: me.socialGitHub,
      fullName: me.displayName,
      avatarUrl: me.avatarURL,
    });

    const signature = await signParticularManifesto(token, {
      githubUsername: profile.githubUsername,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      message: body.message,
      location: body.location,
      privacyConsent: true,
    });

    return NextResponse.json(signature, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create signature" },
      { status: 502 },
    );
  }
}
