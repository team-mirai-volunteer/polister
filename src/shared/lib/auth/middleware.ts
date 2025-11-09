import NextAuth from "next-auth";

import { authConfigBase } from "@/shared/lib/auth/config";

export const { auth: middlewareAuth } = NextAuth(authConfigBase);
