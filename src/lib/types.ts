export type Profile = {
  id: string;
  github_username: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
};

export type Signature = {
  id: string;
  user_id: string;
  message?: string;
  location?: string;
  privacy_consent: boolean;
  signed_at: string;
  created_at: string;
  profiles: Profile;
};

/** UI-facing user shape (mapped from mf-go session). */
export type ManifestoUser = {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    preferred_username?: string;
    user_name?: string;
  };
};

export type MfGoUser = {
  id: string;
  email: string;
  displayName?: string | null;
  avatarURL?: string | null;
  socialGitHub?: string | null;
};
