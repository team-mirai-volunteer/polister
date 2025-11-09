import type { UserRole } from "@prisma/client";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

const defaultUserRole: UserRole = "VIEWER";

const getNextAuthSecret = (): string => {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXTAUTH_SECRET is required in production. Please set it in your environment variables."
      );
    }

    // 開発環境用のデフォルト値（警告を出す）
    console.warn(
      "⚠️  NEXTAUTH_SECRET is not set. Using a default value for development. " +
        "Please set NEXTAUTH_SECRET in your .env file for production use."
    );
    return "development-secret-change-this-in-production";
  }

  return secret.trim();
};

const buildSessionUser = (
  sessionUser: DefaultSession["user"] | undefined,
  token: JWT
): DefaultSession["user"] & {
  id: string;
  role: UserRole;
  emailVerified: Date | null;
} => {
  const name = token.name ?? sessionUser?.name ?? null;
  const email: string = (token.email ?? sessionUser?.email ?? "") as string;
  const image = token.picture ?? sessionUser?.image ?? null;
  const emailVerified =
    (sessionUser as { emailVerified?: Date | null } | undefined)
      ?.emailVerified ?? null;

  return {
    id: (token.sub ?? "") as string,
    role: (token.role ?? defaultUserRole) as UserRole,
    name,
    email,
    image,
    emailVerified,
  };
};

export const authConfigBase: NextAuthConfig = {
  secret: getNextAuthSecret(),
  providers: [],
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user.role ?? defaultUserRole) as UserRole;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        token.picture = user.image ?? token.picture;
      }

      return token;
    },
    session({ session, token }) {
      const enrichedUser = buildSessionUser(session.user, token);
      session.user = session.user ?? {};
      Object.assign(session.user, enrichedUser);
      return session;
    },
  },
};

export const AUTH_DEFAULT_ROLE = defaultUserRole;
