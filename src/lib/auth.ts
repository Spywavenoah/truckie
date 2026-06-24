import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { cleanupUnverifiedAccounts } from "./cleanup";

export const { handlers, signIn, signOut, auth } = NextAuth({
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

        cleanupUnverifiedAccounts();

        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;

        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          include: { twoFactorAuth: true },
        });

        if (!user) return null;
        if (user.status !== "ACTIVE") return null;
        if (!user.emailVerified) throw new Error("Please verify your email before logging in");

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified?.toISOString() || null,
          requires2FA: user.twoFactorAuth?.enabled || false,
          has2FA: !!user.twoFactorAuth,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.requires2FA = (user as any).requires2FA;
        token.has2FA = (user as any).has2FA;
        token.emailVerified = (user as any).emailVerified;
      }
      if (trigger === "update" && session) {
        token.requires2FA = session.requires2FA;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as any;
        user.id = token.id as string;
        user.role = token.role as string;
        user.requires2FA = token.requires2FA as boolean;
        user.has2FA = token.has2FA as boolean;
        user.emailVerified = token.emailVerified as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 15 * 60,
  },
});
