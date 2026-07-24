import { NextRequest, NextResponse } from "next/server";
import { fetchGithubClientId } from "@/lib/mf-data";

export const GET = async (req: NextRequest) => {
  try {
    const clientId = await fetchGithubClientId();
    if (!clientId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "GitHub OAuth is not configured on mf-go (mfCorePublicAuth.githubClientId empty). Set MF_CORE_GITHUB_CLIENT_ID + MF_CORE_GITHUB_CLIENT_SECRET in mf-go/.env (or app_settings mf_core.github_oauth_source_app_id → a client app github integration), restart mf-go, and add callback http://localhost:3020/auth/callback on the GitHub OAuth App.",
        },
        { status: 503 },
      );
    }
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/auth/callback`;
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "read:user user:email");
    return NextResponse.redirect(url.toString());
  } catch (e) {
    const message = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
};
