import type { UserRole } from "@prisma/client";
import type { Session } from "next-auth";

import { ForbiddenError } from "@/shared/errors/application-error";

import { requireAuth } from "./session";

/**
 * ロール階層定義
 * 数値が大きいほど権限が高い
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  COORDINATOR: 2,
  ADMIN: 3,
};

/**
 * ユーザーのロールが必要なロール以上かチェック
 */
export const hasRole = (
  userRole: UserRole,
  requiredRole: UserRole
): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

/**
 * 特定のロール以上の権限を持つユーザーのみアクセスを許可
 * @throws UnauthorizedError 未認証の場合
 * @throws ForbiddenError 権限不足の場合
 */
export const requireRole = async (
  requiredRole: UserRole
): Promise<Session> => {
  const session = await requireAuth();

  if (!hasRole(session.user.role, requiredRole)) {
    throw new ForbiddenError(`${requiredRole}以上の権限が必要です`);
  }

  return session;
};

/**
 * 指定されたロールのいずれかを持つユーザーのみアクセスを許可
 * @throws UnauthorizedError 未認証の場合
 * @throws ForbiddenError 権限不足の場合
 */
export const requireExactRole = async (
  allowedRoles: UserRole[]
): Promise<Session> => {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError("この操作を実行する権限がありません");
  }

  return session;
};

/**
 * 管理者のみアクセスを許可
 * @throws UnauthorizedError 未認証の場合
 * @throws ForbiddenError 権限不足の場合
 */
export const requireAdmin = async (): Promise<Session> => {
  return requireRole("ADMIN");
};

/**
 * コーディネーター以上のみアクセスを許可
 * @throws UnauthorizedError 未認証の場合
 * @throws ForbiddenError 権限不足の場合
 */
export const requireCoordinator = async (): Promise<Session> => {
  return requireRole("COORDINATOR");
};

/**
 * エディター以上のみアクセスを許可
 * @throws UnauthorizedError 未認証の場合
 * @throws ForbiddenError 権限不足の場合
 */
export const requireEditor = async (): Promise<Session> => {
  return requireRole("EDITOR");
};
