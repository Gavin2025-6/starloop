import { google } from "googleapis";

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/business.manage",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export async function getBusinessLocations(accessToken: string) {
  oauth2Client.setCredentials({ access_token: accessToken });

  // Google Business Profile API — list accounts and locations
  const mybusiness = google.mybusinessaccountmanagement({
    version: "v1",
    auth: oauth2Client,
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
    auth: oauth2Client,
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
  oauth2Client.setCredentials({ access_token: accessToken });

  // Note: Reviews API requires mybusinessreviews endpoint
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
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[rating] || 0;
}
