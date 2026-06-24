"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Key, Wallet as WalletIcon, Copy, Check } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export interface WalletData {
  id: string;
  balance: number;
  accountName: string | null;
  nubanAccountNumber: string | null;
  bankName: string | null;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  monnifyRef?: string | null;
  balanceBefore: number | null;
  balanceAfter: number | null;
  bookingId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface WalletLayoutProps {
  wallet: WalletData | null;
  transactions: Transaction[];
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onSelectWithdrawal: (wd: any) => void;
  onRefreshWallet: () => void;
  onRefreshTransactions: (p: number) => void;
  hasPin: boolean;
  companyName?: string;
  children?: React.ReactNode;
}

export function WalletBalanceCard({ wallet, onCopy }: { wallet: WalletData | null; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Card>
      <CardContent className="p-6">
        <div className="rounded-lg bg-accent p-6 text-white">
          <p className="text-sm text-neutral-200">Available Balance</p>
          <p className="mt-1 font-heading text-4xl font-bold">
            {formatCurrency(wallet?.balance ?? 0)}
          </p>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-200">Account Name</span>
              <span className="font-medium">{wallet?.accountName || "Your Full Name"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-200">NUBAN Account</span>
              <span className="font-mono font-medium">{wallet?.nubanAccountNumber || "1234567890"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-200">Bank</span>
              <span className="font-medium">{wallet?.bankName || "Monnify Microfinance Bank"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WalletDepositInfo({ wallet }: { wallet: WalletData | null }) {
  const [copied, setCopied] = useState(false);
  if (!wallet?.nubanAccountNumber) return null;
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <WalletIcon className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            Fund your wallet by transferring to your dedicated NUBAN account below.
            Credits are processed automatically via Monnify.
          </p>
        </div>
        <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Bank</span>
              <span className="font-medium">{wallet.bankName || "Monnify Microfinance Bank"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Account Name</span>
              <span className="font-medium">{wallet.accountName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">NUBAN Account</span>
              <span className="font-mono font-bold text-lg">{wallet.nubanAccountNumber}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => {
              navigator.clipboard.writeText(wallet.nubanAccountNumber!);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <><Check className="mr-2 h-4 w-4" /> Copied!</> : <><Copy className="mr-2 h-4 w-4" /> Copy NUBAN</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WalletPinSetup({
  hasPin, currentPin, onCurrentPinChange,
  newPin, onNewPinChange,
  confirmPin, onConfirmPinChange,
  busy, onSave,
}: {
  hasPin: boolean;
  currentPin: string;
  onCurrentPinChange: (v: string) => void;
  newPin: string;
  onNewPinChange: (v: string) => void;
  confirmPin: string;
  onConfirmPinChange: (v: string) => void;
  busy: boolean;
  onSave: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" /> Transfer PIN
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-neutral-500">
          Your transfer PIN is required to authorize withdrawals. {hasPin ? "Enter your current PIN to change it." : "Set a 4-digit PIN."}
        </p>
        {hasPin && (
          <div>
            <label htmlFor="wallet-current-pin" className="block text-sm font-medium text-neutral-700">Current PIN</label>
            <input id="wallet-current-pin" type="password" value={currentPin} onChange={(e) => onCurrentPinChange(e.target.value)} maxLength={4}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:max-w-xs" />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wallet-new-pin" className="block text-sm font-medium text-neutral-700">New PIN (4 digits)</label>
            <input id="wallet-new-pin" type="password" value={newPin} onChange={(e) => onNewPinChange(e.target.value)} maxLength={4}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="wallet-confirm-pin" className="block text-sm font-medium text-neutral-700">Confirm PIN</label>
            <input id="wallet-confirm-pin" type="password" value={confirmPin} onChange={(e) => onConfirmPinChange(e.target.value)} maxLength={4}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <Button onClick={onSave} disabled={busy}>
          {busy ? <><Spinner size="sm" className="mr-2" /> Saving...</> : hasPin ? "Change PIN" : "Set PIN"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function WalletTransactionsTable({
  transactions,
  page,
  totalPages,
  onPageChange,
  onSelectTransaction,
}: {
  transactions: Transaction[];
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onSelectTransaction: (tx: Transaction) => void;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">No transactions yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Description</th>
                    <th className="hidden sm:table-cell pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Reference</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Date</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Amount</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50 cursor-pointer" tabIndex={0} role="button"
                      onClick={() => onSelectTransaction(t)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectTransaction(t); } }}>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-neutral-900">{t.description || "-"}</td>
                      <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 font-mono text-xs text-neutral-500">{t.reference || "-"}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{formatDate(t.createdAt)}</td>
                      <td className={`px-3 py-2 md:px-4 md:py-3 font-mono ${t.type === "CREDIT" ? "text-success" : "text-danger"}`}>
                        {t.type === "CREDIT" ? "+" : "-"}{formatCurrency(t.amount)}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-neutral-600">
                        {t.balanceAfter != null ? formatCurrency(t.balanceAfter) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-neutral-500">
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function WalletTabNav({ tab, setTab }: { tab: string; setTab: (t: any) => void }) {
  const tabs = ["deposit", "withdraw", "pin"] as const;
  return (
    <div className="flex gap-2 border-b border-neutral-200">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === t
              ? "border-b-2 border-primary text-primary"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          {t === "deposit" ? "Deposit" : t === "withdraw" ? "Withdraw" : "Transfer PIN"}
        </button>
      ))}
    </div>
  );
}
