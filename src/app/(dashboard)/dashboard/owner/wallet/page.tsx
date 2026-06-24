import { auth } from "@/lib/auth";
import { getOwnerWallet } from "@/lib/dashboard/owner";
import { OwnerWalletClient } from "./wallet-client";

export default async function OwnerWalletPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p className="py-8 text-center text-sm text-neutral-400">You must be signed in to view this page.</p>;
  }
  let wallet;
  try {
    wallet = await getOwnerWallet(session.user.id);
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Wallet</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your NUBAN wallet and transactions.</p>
        </div>
        <p className="py-8 text-center text-sm text-neutral-400">Failed to load wallet data.</p>
      </div>
    );
  }

  const serializedTransactions = (wallet?.transactions || []).map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    description: t.description,
    reference: t.reference,
    monnifyRef: t.monnifyRef,
    balanceBefore: t.balanceBefore,
    balanceAfter: t.balanceAfter,
    bookingId: t.bookingId,
    metadata: typeof t.metadata === "object" && t.metadata !== null && !Array.isArray(t.metadata) ? t.metadata as Record<string, unknown> : null,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <OwnerWalletClient
      wallet={wallet ? { id: wallet.id, balance: wallet.balance, accountName: wallet.accountName, nubanAccountNumber: wallet.nubanAccountNumber, bankName: wallet.bankName } : null}
      initialTransactions={serializedTransactions}
    />
  );
}
