import { prisma } from "@/lib/prisma";
import { refreshAccessToken } from "@/lib/google";

interface GoogleClient {
  accessToken: string;
  locationId: string | null;
}

export async function getGoogleClient(businessId: string): Promise<GoogleClient | null> {
  const conn = await prisma.googleBusinessConnection.findUnique({
    where: { businessId },
    select: { accessToken: true, refreshToken: true, expiresAt: true, locationId: true },
  });

  if (!conn || !conn.accessToken) return null;

  // Refresh if expired (with 60s buffer)
  const needsRefresh = conn.expiresAt && conn.expiresAt.getTime() < Date.now() + 60_000;
  if (needsRefresh && conn.refreshToken) {
    try {
      const tokens = await refreshAccessToken(conn.refreshToken);
      await prisma.googleBusinessConnection.update({
        where: { businessId },
        data: {
          accessToken: tokens.access_token ?? conn.accessToken,
          ...(tokens.expiry_date ? { expiresAt: new Date(tokens.expiry_date) } : {}),
        },
      });
      return { accessToken: tokens.access_token ?? conn.accessToken, locationId: conn.locationId ?? null };
    } catch (err) {
      console.error("[getGoogleClient] refresh failed", err);
      return null;
    }
  }

  return { accessToken: conn.accessToken, locationId: conn.locationId ?? null };
}

// Discovers the first account + location for a business and saves it.
export async function discoverAndSaveLocation(businessId: string): Promise<string | null> {
  const client = await getGoogleClient(businessId);
  if (!client) return null;

  const headers = { Authorization: `Bearer ${client.accessToken}` };

  try {
    // Get first account
    const acctRes = await fetch("https://mybusiness.googleapis.com/v4/accounts", { headers });
    if (!acctRes.ok) {
      console.error("[discoverAndSaveLocation] accounts fetch failed:", acctRes.status);
      return null;
    }
    const acctData = await acctRes.json();
    const account = acctData.accounts?.[0];
    if (!account) return null;

    // Get first location
    const locRes = await fetch(`https://mybusiness.googleapis.com/v4/${account.name}/locations`, { headers });
    if (!locRes.ok) {
      console.error("[discoverAndSaveLocation] locations fetch failed:", locRes.status);
      return null;
    }
    const locData = await locRes.json();
    const location = locData.locations?.[0];
    if (!location) return null;

    // locationName is like "accounts/123/locations/456"
    const locationName: string = location.name;
    await prisma.googleBusinessConnection.update({
      where: { businessId },
      data: { locationId: locationName },
    });

    return locationName;
  } catch (err) {
    console.error("[discoverAndSaveLocation]", err);
    return null;
  }
}
