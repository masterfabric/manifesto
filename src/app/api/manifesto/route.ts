import { NextResponse } from "next/server";
import { fetchParticularDocument } from "@/lib/mf-data";

/**
 * Manifesto body comes from particular-manifesto (SQLite) via mf-go.
 * Markdown structure is preserved; HTML tags in the source (e.g. <u>) are kept.
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
    return NextResponse.json({ error: "Failed to load manifesto content" }, { status: 500 });
  }
}
