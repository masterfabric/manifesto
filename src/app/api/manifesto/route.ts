import { NextResponse } from "next/server";
import { fetchParticularDocument } from "@/lib/mf-data";

/**
 * Optional server proxy. Prefer browser → mf-go (see page.tsx) on Vercel:
 * Cloudflare challenges Vercel egress to api-core.
 */
export async function GET() {
  try {
    const doc = await fetchParticularDocument();
    if (!doc) {
      return NextResponse.json({ error: "Manifesto document not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error loading manifesto from Particular:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load manifesto content" },
      { status: 500 },
    );
  }
}
