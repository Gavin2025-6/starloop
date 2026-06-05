import { google } from "googleapis";

/**
 * Create a fresh OAuth2 client on every call — no singleton caching.
 *
 * Why no singleton: On Railway, if GOOGLE_REDIRECT_URI is incorrect and the
 * process stays alive, a cached singleton would keep the wrong redirect_uri
 * forever. A fresh instance always reads the current env var.
 *
 * The correct redirect_uri for this app is /api/google/callback (not NextAuth's
 * /api/auth/callback/google). If GOOGLE_REDIRECT_URI is not set in Railway,
 * we derive it from NEXT_PUBLIC_APP_URL.
 */
function getOAuth2Client() {
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
}

// Re-export for callers that need to set credentials directly
export function getOAuth2ClientWithToken(accessToken?: string, refreshToken?: string) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
  );
  if (accessToken || refreshToken) {
    client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  }
  return client;
}


export function getAuthUrl(): string {
  return getOAuth2Client().generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/business.manage",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await getOAuth2Client().getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  const client = getOAuth2ClientWithToken(undefined, refreshToken);
  const { credentials } = await client.refreshAccessToken();
  return credentials;
}

export async function getBusinessLocations(accessToken: string) {
  const client = getOAuth2ClientWithToken(accessToken);

  const mybusiness = google.mybusinessaccountmanagement({
    version: "v1",
    auth: client,
  });

  const accountsRes = await mybusiness.accounts.list();
  const accounts = accountsRes.data.accounts || [];

  if (!accounts.length) return [];

  const locations: Array<{
    name: string;
    locationId: string;
    title: string;
    address: string;
  }> = [];

  const mybusinessInfo = google.mybusinessbusinessinformation({
    version: "v1",
    auth: client,
  });

  for (const account of accounts) {
    try {
      const locRes = await mybusinessInfo.accounts.locations.list({
        parent: account.name!,
        readMask: "name,title,storefrontAddress",
      });
      for (const loc of locRes.data.locations || []) {
        locations.push({
          name: loc.name || "",
          locationId: loc.name?.split("/").pop() || "",
          title: loc.title || "",
          address: loc.storefrontAddress?.addressLines?.join(", ") || "",
        });
      }
    } catch {
      // Some accounts may not have location access
    }
  }

  return locations;
}

export async function getReviews(
  accessToken: string,
  locationName: string
): Promise<Array<{
  reviewId: string;
  reviewer: string;
  rating: number;
  comment: string;
  createTime: string;
}>> {
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  const reviews = data.reviews || [];

  return reviews.map((r: Record<string, unknown>) => ({
    reviewId: (r.reviewId as string) || "",
    reviewer: ((r.reviewer as Record<string, unknown>)?.displayName as string) || "Anonymous",
    rating: ratingToNumber((r.starRating as string) || ""),
    comment: (r.comment as string) || "",
    createTime: (r.createTime as string) || new Date().toISOString(),
  }));
}

export async function publishReply(
  accessToken: string,
  reviewName: string,
  replyText: string
): Promise<boolean> {
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: replyText }),
    }
  );
  return response.ok;
}

function ratingToNumber(rating: string): number {
  const map: Record<string, number> = {
    ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
  };
  return map[rating] || 0;
}

