"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { WalletWithdrawals } from "@/components/wallet-withdrawals";
import { WithdrawalForm } from "@/components/withdrawal-form";
import { TransactionDetailModal } from "@/components/transaction-detail";
import {
  WalletBalanceCard,
  WalletDepositInfo,
  WalletPinSetup,
  WalletTransactionsTable,
  WalletTabNav,
  type Transaction,
} from "@/components/wallet-layout";

interface WalletData {
  id: string;
  balance: number;
  accountName: string | null;
  nubanAccountNumber: string | null;
  bankName: string | null;
}

interface OwnerWalletClientProps {
  wallet: WalletData | null;
  initialTransactions: Transaction[];
}

interface User {
  transferPin: string | null;
  email: string;
}

export function OwnerWalletClient({ wallet: initialWallet, initialTransactions }: OwnerWalletClientProps) {
  const [wallet, setWallet] = useState<WalletData | null>(initialWallet);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState<"deposit" | "withdraw" | "pin">("deposit");

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [busy, setBusy] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedWd, setSelectedWd] = useState<any>(null);

  const loadDataRef = useRef<AbortController | null>(null);

  async function loadData() {
    loadDataRef.current?.abort();
    const ac = new AbortController();
    loadDataRef.current = ac;
    try {
      const [wRes, uRes] = await Promise.all([
        fetch("/api/wallet", { signal: ac.signal }),
        fetch("/api/users/me", { signal: ac.signal }),
      ]);
      const wJson = await wRes.json();
      const uJson = await uRes.json();
      if (wJson.success) setWallet(wJson.data);
      if (uJson.success) setUser(uJson.data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      showMsg("Failed to load data", "error");
    }
  }

  useEffect(() => {
    loadData();
    return () => loadDataRef.current?.abort();
  }, []);

  function showMsg(text: string, type: "success" | "error") {
    setMsg(text);
    setMsgType(type);
    toast(text, { variant: type === "success" ? "success" : "error" });
    setTimeout(() => setMsg(""), 6000);
  }

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/wallet");
      const json = await res.json();
      if (json.success) setWallet(json.data);
    } catch (err) {
      console.error("Failed to load wallet", err);
    }
  };

  const fetchTransactions = async (p: number) => {
    try {
      const res = await fetch(`/api/wallet/transactions?page=${p}&limit=10`);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data);
        setTotalPages(json.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to load transactions", err);
    }
  };

  async function savePin() {
    if (!newPin || !/^\d{4}$/.test(newPin)) {
      showMsg("PIN must be exactly 4 digits", "error");
      return;
    }
    if (newPin !== confirmPin) {
      showMsg("PINs do not match", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/users/me/transfer-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPin: currentPin || undefined,
          newPin,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showMsg("Transfer PIN set successfully", "success");
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        loadData();
      } else {
        showMsg(json.error || "Failed to set PIN", "error");
      }
    } catch {
      showMsg("An error occurred", "error");
    } finally {
      setBusy(false);
    }
  }

  const goToPage = (p: number) => {
    setPage(p);
    fetchTransactions(p);
  };

  const hasPin = !!user?.transferPin;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Wallet</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage your NUBAN wallet and transactions.</p>
      </div>

      {msg && (
        <div className={`rounded-md p-3 text-sm ${msgType === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg}
        </div>
      )}

      <WalletBalanceCard wallet={wallet} onCopy={() => {}} />

      <WalletTabNav tab={tab} setTab={setTab} />

      {tab === "deposit" && <WalletDepositInfo wallet={wallet} />}

      {tab === "withdraw" && (
        <Card>
          <CardHeader><CardTitle>Withdraw Funds</CardTitle></CardHeader>
          <CardContent>
            <WithdrawalForm
              walletBalance={wallet?.balance || 0}
              hasPin={hasPin}
              userEmail={user?.email || ""}
              onSuccess={() => { fetchWallet(); fetchTransactions(page); }}
            />
          </CardContent>
        </Card>
      )}

      {tab === "pin" && (
        <WalletPinSetup
          hasPin={hasPin}
          currentPin={currentPin}
          onCurrentPinChange={setCurrentPin}
          newPin={newPin}
          onNewPinChange={setNewPin}
          confirmPin={confirmPin}
          onConfirmPinChange={setConfirmPin}
          busy={busy}
          onSave={savePin}
        />
      )}

      <WalletTransactionsTable
        transactions={transactions}
        page={page}
        totalPages={totalPages}
        onPageChange={goToPage}
        onSelectTransaction={(tx) => setSelectedTx(tx)}
      />

      <WalletWithdrawals onSelectWithdrawal={(w) => setSelectedWd(w)} />

      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          withdrawal={null}
          onClose={() => setSelectedTx(null)}
        />
      )}
      {selectedWd && (
        <TransactionDetailModal
          transaction={null}
          withdrawal={selectedWd}
          onClose={() => setSelectedWd(null)}
        />
      )}
    </div>
  );
}
