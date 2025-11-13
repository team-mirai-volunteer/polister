export { middlewareAuth as default } from "@/shared/lib/auth/middleware";

export const config = {
  matcher: ["/board-imports/:path*"],
};
