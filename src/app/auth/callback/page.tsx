"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { loginWithGitHubCode } from "@/lib/mf-data";
import { notifySessionChange, setSession } from "@/lib/mf-session";

/**
 * OAuth callback must run in the browser so the loginWithGitHub hop uses the
 * visitor IP (Cloudflare allows it). A Route Handler would use Vercel egress and get challenged.
 */
const AuthCallbackInner = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      if (error) {
        const q = new URLSearchParams({
          error,
          description: errorDescription || "",
        });
        window.location.replace(`/auth/auth-code-error?${q.toString()}`);
        return;
      }

      const code = searchParams.get("code");
      if (!code) {
        window.location.replace("/auth/auth-code-error?error=missing_code");
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        const result = await loginWithGitHubCode(code, redirectUri);
        if (cancelled) return;

        if (result.otpRequired) {
          window.location.replace(
            "/auth/auth-code-error?error=otp_required&description=" +
              encodeURIComponent("OTP is required for this account"),
          );
          return;
        }
        if (!result.accessToken || !result.user) {
          window.location.replace("/auth/auth-code-error?error=login_failed");
          return;
        }

        setSession({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken || null,
          user: {
            id: result.user.id,
            email: result.user.email,
            displayName: result.user.displayName || null,
            avatarURL: result.user.avatarURL || null,
            socialGitHub: null,
          },
        });

        // AuthUser has no socialGitHub — enrich from me (UserProfile) when possible.
        try {
          const { fetchMe } = await import("@/lib/mf-data");
          const me = await fetchMe(result.accessToken);
          setSession({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken || null,
            user: {
              id: me.id,
              email: me.email,
              displayName: me.displayName || null,
              avatarURL: me.avatarURL || null,
              socialGitHub: me.socialGitHub || null,
            },
          });
        } catch {
          /* keep AuthUser fields */
        }

        notifySessionChange();
        // welcome=1 opens the sign flow on home (no hash; AuthHashHandler is unused here).
        window.location.replace("/?welcome=1");
      } catch (err) {
        const message = err instanceof Error ? err.message : "callback_exception";
        window.location.replace(
          `/auth/auth-code-error?error=callback_exception&description=${encodeURIComponent(message)}`,
        );
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <p className="text-sm text-gray-600" role="status" aria-live="polite">
        Completing GitHub sign-in…
      </p>
    </div>
  );
};

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white px-6">
          <p className="text-sm text-gray-600">Completing GitHub sign-in…</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
