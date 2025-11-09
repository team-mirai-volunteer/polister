import type { UserRole } from "@prisma/client";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

const defaultUserRole: UserRole = "VIEWER";

const warnMissingSecretInDevelopment = () => {
  if (process.env.NODE_ENV !== "production" && !process.env.NEXTAUTH_SECRET) {
    console.warn(
      "⚠️  NEXTAUTH_SECRET is not set. Please configure it in your .env file when testing NextAuth."
    );
  }
};
warnMissingSecretInDevelopment();

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
