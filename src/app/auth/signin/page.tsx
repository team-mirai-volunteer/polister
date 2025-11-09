import type { Metadata } from "next";

import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "サインイン | Polister",
};

interface SignInPageProps {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
}

const getSafeCallbackUrl = (value?: string): string => {
  if (!value) {
    return "/";
  }

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("/")) {
      return decoded;
    }
    const url = new URL(decoded);
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolved = searchParams ? await searchParams : undefined;
  const callbackUrl = getSafeCallbackUrl(resolved?.callbackUrl);
  const error = resolved?.error ?? null;

  return <SignInForm callbackUrl={callbackUrl} initialError={error} />;
}
