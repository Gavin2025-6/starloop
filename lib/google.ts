/**
 * Google OAuth2 helpers — implemented with raw fetch (no googleapis SDK).
 *
 * Create a fresh redirect URI on every call — no singleton caching.
 * If GOOGLE_REDIRECT_URI is not set, derive it from NEXT_PUBLIC_APP_URL.
 */

function getRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`
  );
}

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: getRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/business.manage",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
  expires_in?: number;
  token_type?: string;
  error?: string;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  const data: TokenResponse = await res.json();

  if (data.error) {
    throw new Error(`Google token exchange failed: ${data.error}`);
  }

  // Compute expiry_date (epoch ms) from expires_in if not provided
  if (!data.expiry_date && data.expires_in) {
    data.expiry_date = Date.now() + data.expires_in * 1000;
  }

  return data;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });

  const data: TokenResponse = await res.json();

  if (data.error) {
    throw new Error(`Google token refresh failed: ${data.error}`);
  }

  if (!data.expiry_date && data.expires_in) {
    data.expiry_date = Date.now() + data.expires_in * 1000;
  }

  return data;
}
