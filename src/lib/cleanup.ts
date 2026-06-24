import { prisma } from "./prisma";

const CLEANUP_INTERVAL = 30 * 60 * 1000;
let lastCleanup = 0;

export async function cleanupUnverifiedAccounts() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  try {
    const cutoff = new Date(now - 24 * 60 * 60 * 1000);
    const stale = await prisma.user.findMany({
      where: {
        emailVerified: null,
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    });

    if (stale.length === 0) return;

    const ids = stale.map((u) => u.id);
    await prisma.$transaction([
      prisma.wallet.deleteMany({ where: { userId: { in: ids } } }),
      prisma.cart.deleteMany({ where: { userId: { in: ids } } }),
      prisma.notification.deleteMany({ where: { userId: { in: ids } } }),
      prisma.user.deleteMany({ where: { id: { in: ids } } }),
    ]);

    console.log(`Cleaned up ${stale.length} unverified account(s) older than 24h`);
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}
