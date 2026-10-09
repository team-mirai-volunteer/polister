import type { Session } from "next-auth";

import { UnauthorizedError } from "@/shared/errors/application-error";

import { auth } from "./index";

const hasAuthenticatedUser = (session: Session | null): session is Session =>
  Boolean(session?.user?.id);

export const requireAuth = async (): Promise<Session> => {
  const session = await auth();

  if (!hasAuthenticatedUser(session)) {
    throw new UnauthorizedError();
  }

  return session;
};

/**
 * ログイン中ユーザーの ID を返す。未ログインの場合は null。
 * 結果オブジェクトでエラーを返す Server Action / API Route 向け。
 */
export const getAuthenticatedUserId = async (): Promise<string | null> => {
  const session = await auth();

  return hasAuthenticatedUser(session) ? session.user.id : null;
};
