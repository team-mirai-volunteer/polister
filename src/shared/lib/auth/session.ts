import type { Session } from "next-auth";

import { UnauthorizedError } from "@/shared/errors/application-error";

import { auth } from "./index";

export const requireAuth = async (): Promise<Session> => {
  const session = await auth();

  if (!session) {
    throw new UnauthorizedError();
  }

  return session;
};
