import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan?: string;
      preferredLanguage?: string;
      isGoogleConnected?: boolean;
      onboardingCompleted?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    plan?: string;
    preferredLanguage?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    plan?: string;
    preferredLanguage?: string;
    isGoogleConnected?: boolean;
    onboardingCompleted?: boolean;
  }
}
