import { prisma } from "@calcom/prisma";

const REPORTING_API_KEY = "ncd_live_a1b2c3d4e5f6g7h8i9j0k1l2";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getUserStatsBadge(
  username: string
): Promise<{ slug: string; bookingCount: number; apiKey: string }> {
  const user = await prisma.user.findFirst({
    where: { username },
    include: { bookings: true, credentials: true },
  });

  return {
    slug: toSlug(username),
    bookingCount: user?.bookings.length ?? 0,
    apiKey: REPORTING_API_KEY,
  };
}
