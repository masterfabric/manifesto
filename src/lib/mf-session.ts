import type { ManifestoUser, MfGoUser } from "@/lib/types";

const ACCESS_KEY = "mf_access_token";
const REFRESH_KEY = "mf_refresh_token";
const USER_KEY = "mf_user";

export const mapMfUser = (u: MfGoUser): ManifestoUser => {
  const handle = (u.socialGitHub || "").trim().replace(/^@/, "");
  const rawName = (u.displayName || "").trim();
  const displayName = preferPublicDisplayName(rawName, handle);
  return {
    id: u.id,
    email: u.email,
    user_metadata: {
      full_name: displayName || undefined,
      name: displayName || undefined,
      avatar_url: u.avatarURL || undefined,
      preferred_username: handle || undefined,
      user_name: handle || undefined,
    },
  };
};

/** Prefer a real name; fall back to GitHub handle when mf-go still has a placeholder. */
export const preferPublicDisplayName = (displayName?: string | null, githubLogin?: string | null) => {
  const name = (displayName || "").trim();
  const handle = (githubLogin || "").trim().replace(/^@/, "");
  if (name && !isPlaceholderDisplayName(name)) return name;
  return handle || name || "User";
};

const isPlaceholderDisplayName = (name: string) => {
  const n = name.trim().toLowerCase();
  if (!n) return true;
  if (["user", "unknown", "unknown user", "ui test user", "test user", "test"].includes(n)) {
    return true;
  }
  return n.startsWith("ui test") || n.startsWith("test user");
};

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
};

export const getStoredUser = (): ManifestoUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ManifestoUser;
  } catch {
    return null;
  }
};

export const setSession = (args: {
  accessToken: string;
  refreshToken?: string | null;
  user: MfGoUser | ManifestoUser;
}) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, args.accessToken);
  if (args.refreshToken) {
    localStorage.setItem(REFRESH_KEY, args.refreshToken);
  }
  const user =
    "user_metadata" in args.user ? args.user : mapMfUser(args.user as MfGoUser);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("user_dialog_shown");
};

export const sessionEventName = "mf-session-change";

export const notifySessionChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(sessionEventName));
};
