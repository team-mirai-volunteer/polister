import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const REQUIRED_ENV = ["ADMIN_EMAIL", "ADMIN_PASSWORD"] as const;

const missing = REQUIRED_ENV.filter(
  (key) => !process.env[key] || process.env[key]?.trim().length === 0
);

if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}.\n` +
      "Set ADMIN_EMAIL / ADMIN_PASSWORD (and optionally ADMIN_NAME) before running this script."
  );
  process.exit(1);
}

const email = process.env.ADMIN_EMAIL!.trim().toLowerCase();
const rawPassword = process.env.ADMIN_PASSWORD!.trim();
const displayName =
  process.env.ADMIN_NAME?.trim() && process.env.ADMIN_NAME.trim().length > 0
    ? process.env.ADMIN_NAME.trim()
    : "Polister 管理者";

if (rawPassword.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters long.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash(rawPassword, 12);
  const now = new Date();

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: displayName,
      role: UserRole.ADMIN,
      passwordHash,
      emailVerified: now,
    },
    update: {
      name: displayName,
      role: UserRole.ADMIN,
      passwordHash,
      emailVerified: now,
    },
  });

  console.info(
    `Admin user ready: ${user.email} (role=${user.role}) — password updated.`
  );
}

main()
  .catch((error) => {
    console.error("Failed to create admin user:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
