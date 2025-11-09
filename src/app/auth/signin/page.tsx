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

    // 単一スラッシュで始まるパスのみ許可（絶対URLやホスト指定を拒否）
    // 正規表現: /で始まり、2文字目が/でもバックスラッシュでもない
    if (!/^\/[^/\\]/.test(decoded)) {
      return "/";
    }

    return decoded;
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
