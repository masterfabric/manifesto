/**
 * MasterFabric GraphQL + particular-manifesto forward helpers.
 * Prefer calling from the browser (visitor IP). Vercel Route Handlers that
 * call api-core are often blocked by Cloudflare bot checks.
 */

export const MANIFESTO_PARTICULAR_ID = "manifesto";

export const MANIFESTO_CAPABILITIES = {
  graphql: "manifesto.graphql",
  contentRead: "manifesto.content.read",
  signaturesRead: "manifesto.signatures.read",
  signaturesWrite: "manifesto.signatures.write",
} as const;

export const manifestoParticularDocuments = {
  document: `query ManifestoDocument {
    manifestoDocument { slug title bodyMarkdown updatedAt }
  }`,
  signatures: `query Signatures($limit: Int) {
    signatures(limit: $limit, publicOnly: true) {
      id
      userId
      githubUsername
      fullName
      avatarUrl
      message
      location
      privacyConsent
      signedAt
      createdAt
    }
    signatureCount(publicOnly: true)
  }`,
  mySignature: `query MySignature {
    mySignature {
      id userId githubUsername fullName avatarUrl message location privacyConsent signedAt createdAt
    }
  }`,
  sign: `mutation Sign(
    $githubUsername: String
    $fullName: String
    $avatarUrl: String
    $message: String
    $location: String
    $privacyConsent: Boolean!
  ) {
    signManifesto(
      githubUsername: $githubUsername
      fullName: $fullName
      avatarUrl: $avatarUrl
      message: $message
      location: $location
      privacyConsent: $privacyConsent
    ) {
      id userId githubUsername fullName avatarUrl message location privacyConsent signedAt createdAt
    }
  }`,
  revoke: `mutation Revoke { revokeMySignature }`,
} as const;

export const getMfGraphqlUrl = () =>
  process.env.NEXT_PUBLIC_GRAPHQL_URL?.trim() ||
  process.env.MF_GRAPHQL_URL?.trim() ||
  "http://localhost:8080/graphql";

export const getMfAppApiKey = () =>
  process.env.NEXT_PUBLIC_MF_APP_API_KEY?.trim() ||
  process.env.MF_APP_API_KEY?.trim() ||
  "";

type EnvelopeResult = {
  data?: {
    particularGraphqlEnvelope?: {
      dataJson?: string | null;
      errorsJson?: string | null;
    };
  };
  errors?: { message: string }[];
};

const ENVELOPE_QUERY = `query ParticularGraphqlEnvelope($input: ParticularGraphqlInput!) {
  particularGraphqlEnvelope(input: $input) {
    dataJson
    errorsJson
  }
}`;

export async function mfGraphql<T>(args: {
  query: string;
  variables?: Record<string, unknown>;
  accessToken?: string | null;
  /** mf-core login pattern: omit X-API-Key so app feature gates do not block auth. */
  omitApiKey?: boolean;
}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (!args.omitApiKey) {
    const apiKey = getMfAppApiKey();
    if (!apiKey) {
      throw new Error("MF_APP_API_KEY / NEXT_PUBLIC_MF_APP_API_KEY is required");
    }
    headers["X-API-Key"] = apiKey;
  }
  if (args.accessToken) {
    headers.Authorization = `Bearer ${args.accessToken}`;
  }
  const res = await fetch(getMfGraphqlUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify({ query: args.query, variables: args.variables ?? {} }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200).replace(/\s+/g, " ");
    const cfChallenge = /just a moment/i.test(body);
    if (cfChallenge) {
      throw new Error(
        `mf-go HTTP ${res.status} (Cloudflare blocked this request — call from the browser, not Vercel egress)`,
      );
    }
    const cfRay = res.headers.get("cf-ray");
    throw new Error(
      `mf-go HTTP ${res.status}` +
        (cfRay ? ` cf-ray=${cfRay}` : "") +
        (body ? ` body=${body}` : ""),
    );
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) {
    throw new Error("empty mf-go response");
  }
  return json.data;
}

export async function forwardManifestoParticular<T>(args: {
  requiredCapability: string;
  query: string;
  variablesJson?: string;
  accessToken?: string | null;
}): Promise<T> {
  const data = await mfGraphql<EnvelopeResult["data"]>({
    query: ENVELOPE_QUERY,
    variables: {
      input: {
        particularKey: MANIFESTO_PARTICULAR_ID,
        requiredCapability: args.requiredCapability,
        query: args.query,
        variablesJson: args.variablesJson,
      },
    },
    accessToken: args.accessToken,
  });
  const env = data?.particularGraphqlEnvelope;
  if (!env) {
    throw new Error("empty particularGraphqlEnvelope");
  }
  if (env.errorsJson && env.errorsJson !== "null" && env.errorsJson !== "[]") {
    let msg = env.errorsJson;
    try {
      const parsed = JSON.parse(env.errorsJson) as { message?: string }[] | { message?: string };
      if (Array.isArray(parsed)) {
        msg = parsed.map((e) => e.message || JSON.stringify(e)).join("; ");
      } else if (parsed && typeof parsed === "object" && parsed.message) {
        msg = parsed.message;
      }
    } catch {
      /* keep raw */
    }
    throw new Error(msg || "particular GraphQL errors");
  }
  if (!env.dataJson || env.dataJson === "null") {
    throw new Error("empty particularGraphqlEnvelope dataJson");
  }
  // mf-go dataJson is the Particular response's `data` object (not { data, errors }).
  const payload = JSON.parse(env.dataJson) as T;
  if (payload === null || payload === undefined) {
    throw new Error("empty particular inner data");
  }
  return payload;
}
