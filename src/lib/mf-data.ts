import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";
import {
  forwardManifestoParticular,
  MANIFESTO_CAPABILITIES,
  manifestoParticularDocuments,
  mfGraphql,
} from "@/lib/mf-particular";
import type { Signature } from "@/lib/types";

const markdownToHtml = async (markdownBody: string) => {
  const processed = await remark()
    .use(remarkGfm)
    .use(html, { allowDangerousHtml: true })
    .process(markdownBody);
  return processed.toString();
};

type ParticularSignature = {
  id: string;
  userId: string;
  githubUsername: string;
  fullName: string;
  avatarUrl: string;
  message: string;
  location: string;
  privacyConsent: boolean;
  signedAt: string;
  createdAt: string;
};

export const mapParticularSignature = (row: ParticularSignature): Signature => {
  const github = (row.githubUsername || "").trim().replace(/^@/, "") || "unknown";
  const fullName = (row.fullName || "").trim() || "Unknown User";
  const avatar =
    (row.avatarUrl || "").trim() ||
    (github !== "unknown"
      ? `https://avatars.githubusercontent.com/${encodeURIComponent(github)}`
      : "");
  return {
    id: row.id,
    user_id: row.userId,
    message: row.message || undefined,
    location: row.location || undefined,
    privacy_consent: row.privacyConsent,
    signed_at: row.signedAt,
    created_at: row.createdAt || row.signedAt,
    // Same public profile shape as the previous Supabase `profiles` join.
    profiles: {
      id: row.userId,
      github_username: github,
      full_name: fullName,
      avatar_url: avatar,
      created_at: row.createdAt || row.signedAt,
      updated_at: row.createdAt || row.signedAt,
    },
  };
};

export const normalizePublicProfile = (input: {
  githubUsername?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}) => {
  const githubUsername =
    (input.githubUsername || "").trim().replace(/^@/, "") || "unknown";
  const rawName = (input.fullName || "").trim();
  const fullName =
    rawName && !isPlaceholderName(rawName)
      ? rawName
      : githubUsername !== "unknown"
        ? githubUsername
        : "Unknown User";
  const avatarUrl =
    (input.avatarUrl || "").trim() ||
    (githubUsername !== "unknown"
      ? `https://avatars.githubusercontent.com/${encodeURIComponent(githubUsername)}`
      : "https://avatars.githubusercontent.com/u/0?v=4");
  return { githubUsername, fullName, avatarUrl };
};

const isPlaceholderName = (name: string) => {
  const n = name.trim().toLowerCase();
  if (!n) return true;
  if (["user", "unknown", "unknown user", "ui test user", "test user", "test"].includes(n)) {
    return true;
  }
  return n.startsWith("ui test") || n.startsWith("test user");
};

/**
 * Load manifesto from Particular DB. Body may include YAML frontmatter
 * (preferred) or be body-only; gray-matter handles both without altering text.
 */
export async function fetchParticularDocument() {
  const data = await forwardManifestoParticular<{
    manifestoDocument: {
      slug: string;
      title: string;
      author?: string;
      date?: string;
      bodyMarkdown: string;
      updatedAt: string;
    } | null;
  }>({
    requiredCapability: MANIFESTO_CAPABILITIES.contentRead,
    query: manifestoParticularDocuments.document,
  });
  const doc = data.manifestoDocument;
  if (!doc) return null;

  const { data: frontmatter, content } = matter(doc.bodyMarkdown);
  const title =
    (typeof frontmatter.title === "string" && frontmatter.title) ||
    doc.title ||
    "Developer Manifesto";
  const author =
    (typeof frontmatter.author === "string" && frontmatter.author) ||
    doc.author ||
    "MasterFabric Developers";
  const date =
    (typeof frontmatter.date === "string" && frontmatter.date) ||
    doc.date ||
    doc.updatedAt.slice(0, 10);

  return {
    frontmatter: { title, author, date },
    content: await markdownToHtml(content),
    source: "particular" as const,
  };
}

export async function fetchParticularSignatures(limit = 100) {
  const data = await forwardManifestoParticular<{
    signatures: ParticularSignature[];
    signatureCount: number;
  }>({
    requiredCapability: MANIFESTO_CAPABILITIES.signaturesRead,
    query: manifestoParticularDocuments.signatures,
    variablesJson: JSON.stringify({ limit }),
  });
  return {
    signatures: (data.signatures || []).map(mapParticularSignature),
    signatureCount: data.signatureCount ?? 0,
  };
}

export async function fetchMyParticularSignature(accessToken: string) {
  const data = await forwardManifestoParticular<{
    mySignature: ParticularSignature | null;
  }>({
    requiredCapability: MANIFESTO_CAPABILITIES.signaturesRead,
    query: manifestoParticularDocuments.mySignature,
    accessToken,
  });
  return data.mySignature ? mapParticularSignature(data.mySignature) : null;
}

export async function signParticularManifesto(
  accessToken: string,
  input: {
    githubUsername?: string;
    fullName?: string;
    avatarUrl?: string;
    message?: string;
    location?: string;
    privacyConsent: boolean;
  },
) {
  const data = await forwardManifestoParticular<{ signManifesto: ParticularSignature }>({
    requiredCapability: MANIFESTO_CAPABILITIES.signaturesWrite,
    query: manifestoParticularDocuments.sign,
    variablesJson: JSON.stringify(input),
    accessToken,
  });
  return mapParticularSignature(data.signManifesto);
}

export async function fetchGithubClientId(): Promise<string | null> {
  const data = await mfGraphql<{ mfCorePublicAuth: { githubClientId?: string | null } }>({
    query: `query { mfCorePublicAuth { githubClientId } }`,
    omitApiKey: true,
  });
  return data.mfCorePublicAuth?.githubClientId?.trim() || null;
}

export async function loginWithGitHubCode(code: string, redirectUri: string) {
  const data = await mfGraphql<{
    loginWithGitHub: {
      otpRequired?: boolean;
      accessToken?: string | null;
      refreshToken?: string | null;
      user?: {
        id: string;
        email: string;
        displayName?: string | null;
        avatarURL?: string | null;
        socialGitHub?: string | null;
      } | null;
    };
  }>({
    query: `mutation LoginWithGitHub($input: LoginWithGitHubInput!) {
      loginWithGitHub(input: $input) {
        otpRequired
        accessToken
        refreshToken
        user { id email displayName avatarURL }
      }
    }`,
    variables: { input: { code, redirectUri } },
    omitApiKey: true,
  });
  return data.loginWithGitHub;
}

export async function fetchMe(accessToken: string) {
  const data = await mfGraphql<{
    me: {
      id: string;
      email: string;
      displayName?: string | null;
      avatarURL?: string | null;
      socialGitHub?: string | null;
    };
  }>({
    query: `query Me {
      me { id email displayName avatarURL socialGitHub }
    }`,
    accessToken,
  });
  return data.me;
}
