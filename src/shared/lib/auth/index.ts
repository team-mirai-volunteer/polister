import type { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { AUTH_DEFAULT_ROLE, authConfigBase } from "@/shared/lib/auth/config";
import { resolve, setupDI, TOKENS } from "@/shared/lib/di";

setupDI();

const prisma = resolve(TOKENS.PrismaClient) as PrismaClient;

const credentialsProvider = Credentials({
  name: "メールアドレスとパスワード",
  credentials: {
    email: {
      label: "メールアドレス",
      type: "email",
      placeholder: "user@example.com",
    },
    password: { label: "パスワード", type: "password" },
  },
  async authorize(credentials) {
    const rawEmail =
      typeof credentials?.email === "string" ? credentials.email : undefined;
    const rawPassword =
      typeof credentials?.password === "string"
        ? credentials.password
        : undefined;

    const email = rawEmail?.toLowerCase().trim();
    const password = rawPassword ?? "";

    if (!email || password.length === 0) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role ?? AUTH_DEFAULT_ROLE,
      emailVerified: user.emailVerified,
    };
  },
});

export const authConfig: NextAuthConfig = {
  ...authConfigBase,
  providers: [credentialsProvider],
  events: {
    async signIn({ user, account }) {
      const logger = resolve(TOKENS.Logger);
      logger.info("ユーザーがサインインしました。", {
        userId: user.id,
        provider: account?.provider,
      });
    },
    async signOut(message) {
      const logger = resolve(TOKENS.Logger);
      const sessionUserId =
        "session" in message
          ? ((message.session as { user?: { id?: string } }).user?.id ?? null)
          : null;
      const userId =
        "token" in message
          ? (message.token?.sub ?? sessionUserId)
          : sessionUserId;
      logger.info("ユーザーがサインアウトしました。", {
        userId,
      });
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
