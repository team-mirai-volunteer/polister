import { NextResponse } from "next/server";

import { middlewareAuth } from "@/shared/lib/auth/middleware";

export default middlewareAuth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/board-imports/:path*"],
};
