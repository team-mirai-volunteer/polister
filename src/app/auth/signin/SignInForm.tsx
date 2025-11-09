"use client";

import LoginIcon from "@mui/icons-material/Login";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "メールアドレスまたはパスワードが正しくありません。",
  default: "サインインに失敗しました。入力内容を確認してください。",
};

interface SignInFormProps {
  callbackUrl: string;
  initialError?: string | null;
}

export function SignInForm({ callbackUrl, initialError }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    initialError
      ? (ERROR_MESSAGES[initialError] ?? ERROR_MESSAGES.default)
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.default);
          return;
        }

        const destination = result?.url ?? callbackUrl ?? "/";
        router.push(destination);
        router.refresh();
      } catch (submissionError) {
        console.error("Sign-in failed", submissionError);
        setError(ERROR_MESSAGES.default);
      } finally {
        setIsSubmitting(false);
      }
    },
    [callbackUrl, email, password, router]
  );

  return (
    <Box
      component="section"
      sx={{
        maxWidth: 420,
        mx: "auto",
        mt: { xs: 6, md: 10 },
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        boxShadow: (theme) => theme.shadows[2],
      }}
    >
      <Stack spacing={3} component="form" onSubmit={handleSubmit}>
        <div>
          <Typography component="h1" variant="h5" fontWeight={700} gutterBottom>
            サインイン
          </Typography>
          <Typography variant="body2" color="text.secondary">
            管理者から付与されたメールアドレスとパスワードを入力してください。
          </Typography>
        </div>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          label="メールアドレス"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          fullWidth
        />

        <TextField
          label="パスワード"
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          fullWidth
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          endIcon={<LoginIcon />}
          disabled={isSubmitting}
        >
          {isSubmitting ? "サインイン中..." : "サインイン"}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          パスワードを忘れた場合は管理者に連絡してください。
        </Typography>

        <Typography variant="body2" textAlign="center">
          <Link href="/" underline="hover">
            ホームに戻る
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}
