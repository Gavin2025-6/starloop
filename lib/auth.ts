import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          preferredLanguage: user.preferredLanguage,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.preferredLanguage = user.preferredLanguage;
      }
      // Always refresh isGoogleConnected + onboardingCompleted from DB
      if (token.id) {
        const [business, user] = await Promise.all([
          prisma.business.findFirst({
            where: { userId: token.id as string },
            select: { isGoogleConnected: true },
          }),
          prisma.user.findUnique({
            where: { id: token.id as string },
            select: { onboardingCompleted: true },
          }),
        ]);
        token.isGoogleConnected = business?.isGoogleConnected ?? false;
        token.onboardingCompleted = user?.onboardingCompleted ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.plan = token.plan;
        session.user.preferredLanguage = token.preferredLanguage;
        session.user.isGoogleConnected = token.isGoogleConnected;
        session.user.onboardingCompleted = token.onboardingCompleted;
      }
      return session;
    },
  },
  pages: {
    signIn: "/en/auth/login",
    error: "/en/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
