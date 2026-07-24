import { NextRequest, NextResponse } from "next/server";
import { loginWithGitHubCode } from "@/lib/mf-data";

export const GET = async (request: NextRequest) => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectDomain = isLocalEnv ? origin : "https://manifesto.masterfabric.co";

  if (error) {
    return NextResponse.redirect(
      `${redirectDomain}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || "")}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${redirectDomain}/auth/auth-code-error?error=missing_code`);
  }

  try {
    const redirectUri = `${origin}/auth/callback`;
    const result = await loginWithGitHubCode(code, redirectUri);
    if (result.otpRequired) {
      return NextResponse.redirect(
        `${redirectDomain}/auth/auth-code-error?error=otp_required&description=${encodeURIComponent("OTP is required for this account")}`,
      );
    }
    if (!result.accessToken || !result.user) {
      return NextResponse.redirect(`${redirectDomain}/auth/auth-code-error?error=login_failed`);
    }
    const hash = new URLSearchParams({
      access_token: result.accessToken,
      refresh_token: result.refreshToken || "",
      user_id: result.user.id,
      email: result.user.email,
      display_name: result.user.displayName || "",
      avatar_url: result.user.avatarURL || "",
    });
    return NextResponse.redirect(`${redirectDomain}/#${hash.toString()}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "callback_exception";
    return NextResponse.redirect(
      `${redirectDomain}/auth/auth-code-error?error=callback_exception&description=${encodeURIComponent(message)}`,
    );
  }
};
