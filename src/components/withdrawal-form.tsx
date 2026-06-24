"use client";

import { useState, useEffect, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Send } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface Bank {
  bankName: string;
  bankCode: string;
}

interface WithdrawalFormProps {
  walletBalance: number;
  hasPin: boolean;
  userEmail: string;
  onSuccess: () => void;
}

interface FormState {
  amount: string;
  selectedBank: string;
  selectedBankName: string;
  destAcct: string;
  acctName: string;
}

type FormAction =
  | { type: "SET_AMOUNT"; value: string }
  | { type: "SET_BANK"; code: string; name: string }
  | { type: "SET_DEST_ACCT"; value: string }
  | { type: "SET_ACCT_NAME"; value: string }
  | { type: "RESET" };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_AMOUNT": return { ...state, amount: action.value };
    case "SET_BANK": return { ...state, selectedBank: action.code, selectedBankName: action.name };
    case "SET_DEST_ACCT": return { ...state, destAcct: action.value };
    case "SET_ACCT_NAME": return { ...state, acctName: action.value };
    case "RESET": return { amount: "", selectedBank: "", selectedBankName: "", destAcct: "", acctName: "" };
    default: return state;
  }
}

export function WithdrawalForm({ walletBalance, hasPin, userEmail, onSuccess }: WithdrawalFormProps) {
  const [form, dispatch] = useReducer(formReducer, { amount: "", selectedBank: "", selectedBankName: "", destAcct: "", acctName: "" });
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [validating, setValidating] = useState(false);
  const [manualAcctName, setManualAcctName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null);
  const [acctError, setAcctError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [transferPin, setTransferPin] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  const CHARGE_RATE = 0.015;
  const VAT_RATE = 0.075;

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/banks", { signal: ac.signal })
      .then((r) => r.json())
      .then((res) => { if (res.success) setBanks(res.data); })
      .catch(() => {})
      .finally(() => setLoadingBanks(false));
    return () => ac.abort();
  }, []);

  const charge = parseFloat(form.amount) ? Math.ceil(parseFloat(form.amount) * CHARGE_RATE) : 0;
  const vat = Math.ceil(charge * VAT_RATE);
  const totalDeduction = parseFloat(form.amount) ? parseFloat(form.amount) + charge + vat : 0;
  const canCover = walletBalance >= totalDeduction;

  useEffect(() => {
    const ac = new AbortController();
    if (form.destAcct.length === 10 && form.selectedBank) {
      setValidating(true);
      setAcctError("");
      fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankCode: form.selectedBank, accountNumber: form.destAcct }),
        signal: ac.signal,
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data?.accountName) {
            dispatch({ type: "SET_ACCT_NAME", value: res.data.accountName });
            setManualAcctName(false);
          } else {
            dispatch({ type: "SET_ACCT_NAME", value: "" });
            setManualAcctName(true);
            setAcctError("Could not auto-validate — type your account name below");
          }
        })
        .catch(() => {
          dispatch({ type: "SET_ACCT_NAME", value: "" });
          setManualAcctName(true);
          setAcctError("Validation service unavailable — type your account name below");
        })
        .finally(() => setValidating(false));
    } else {
      dispatch({ type: "SET_ACCT_NAME", value: "" });
      setManualAcctName(false);
      setAcctError(form.destAcct.length > 0 && form.destAcct.length !== 10 ? "Account number must be 10 digits" : "");
    }
    return () => ac.abort();
  }, [form.destAcct, form.selectedBank]);

  function handleBlur() {
    if (form.destAcct.length > 0 && form.destAcct.length !== 10) {
      setAcctError("Account number must be 10 digits");
    } else if (form.destAcct.length === 10 && !form.selectedBank) {
      setAcctError("Select a bank first");
    } else if (form.destAcct.length === 10 && form.selectedBank && !form.acctName && !validating) {
      setAcctError("Account validation failed");
    } else {
      setAcctError("");
    }
  }

  function showMsg(text: string, type: "success" | "error") {
    toast(text, { variant: type === "success" ? "success" : "error" });
  }

  async function requestWithdrawal() {
    if (busy) return;
    if (!form.amount || !form.selectedBank || !form.destAcct || !form.acctName) {
      showMsg("All fields are required", "error");
      return;
    }
    if (!canCover) {
      showMsg(`Insufficient balance. You need ₦${totalDeduction.toLocaleString()} (amount + ₦${(charge + vat).toLocaleString()} fees)`, "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          destinationBank: form.selectedBankName,
          destinationAccount: form.destAcct,
          accountName: form.acctName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setWithdrawalId(json.data.withdrawalId);
        showMsg(json.message, "success");
      } else {
        showMsg(json.error || "Request failed", "error");
      }
    } catch {
      showMsg("An error occurred", "error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmWithdrawal() {
    if (busy) return;
    if (!withdrawalId || !otpCode || !transferPin) {
      showMsg("OTP and transfer PIN are required", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/wallet/withdraw/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, otpCode, transferPin }),
      });
      const json = await res.json();
      if (json.success) {
        showMsg(json.message, "success");
        setWithdrawalId(null);
        setOtpCode("");
        setTransferPin("");
        dispatch({ type: "RESET" });
        onSuccess();
      } else {
        showMsg(json.error || "Confirmation failed", "error");
      }
    } catch {
      showMsg("An error occurred", "error");
    } finally {
      setBusy(false);
    }
  }

  if (!hasPin) {
    return (
      <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-700">
        You must set a transfer PIN before you can withdraw funds. Go to the <strong>Transfer PIN</strong> tab to set one up.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!withdrawalId ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wd-amount" className="block text-sm font-medium text-neutral-700">Amount (NGN)</label>
              <input id="wd-amount" type="number" value={form.amount} onChange={(e) => dispatch({ type: "SET_AMOUNT", value: e.target.value })}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              {parseFloat(form.amount) > 0 && (
                <div className="mt-1 space-y-0.5 text-xs text-neutral-500">
                  <p>Fee (1.5%): ₦{charge.toLocaleString()}</p>
                  <p>VAT (7.5% of fee): ₦{vat.toLocaleString()}</p>
                  <p className={canCover ? "text-success" : "text-danger"}>
                    Total deducted: ₦{totalDeduction.toLocaleString()}
                    {!canCover && " — insufficient balance"}
                  </p>
                </div>
              )}
            </div>
            <div className="relative">
              <label htmlFor="wd-bank" className="block text-sm font-medium text-neutral-700">Bank</label>
              <input id="wd-bank" type="text" value={form.selectedBankName}
                onChange={(e) => {
                  dispatch({ type: "SET_BANK", code: "", name: e.target.value });
                  setShowBankDropdown(true);
                }}
                onFocus={() => setShowBankDropdown(true)}
                onBlur={() => setTimeout(() => setShowBankDropdown(false), 200)}
                placeholder={loadingBanks ? "Loading banks..." : "Type to search bank..."}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              {showBankDropdown && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg">
                  {banks
                    .filter((b) => b.bankName.toLowerCase().includes(form.selectedBankName.toLowerCase()))
                    .slice(0, 50)
                    .map((b) => (
                      <button
                        key={b.bankCode}
                        type="button"
                        onMouseDown={() => {
                          dispatch({ type: "SET_BANK", code: b.bankCode, name: b.bankName });
                          setShowBankDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 ${form.selectedBank === b.bankCode ? "bg-neutral-50 font-medium" : ""}`}
                      >
                        {b.bankName}
                      </button>
                    ))}
                  {banks.filter((b) => b.bankName.toLowerCase().includes(form.selectedBankName.toLowerCase())).length === 0 && (
                    <p className="px-3 py-2 text-sm text-neutral-400">No banks found</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="wd-account" className="block text-sm font-medium text-neutral-700">Account Number</label>
              <input id="wd-account" type="text" value={form.destAcct} onChange={(e) => dispatch({ type: "SET_DEST_ACCT", value: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                onBlur={handleBlur}
                maxLength={10} placeholder="10-digit NUBAN"
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              {acctError && <p className="mt-1 text-xs text-danger">{acctError}</p>}
            </div>
            <div>
              <label htmlFor="wd-acct-name" className="block text-sm font-medium text-neutral-700">Account Name</label>
              {manualAcctName ? (
                <input id="wd-acct-name" type="text" value={form.acctName} onChange={(e) => dispatch({ type: "SET_ACCT_NAME", value: e.target.value })}
                  placeholder="Type account name manually"
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              ) : (
                <div className="relative">
                  <input id="wd-acct-name" type="text" value={validating ? "" : form.acctName} readOnly
                    className="mt-1 block w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600" />
                  {validating && (
                    <div className="absolute inset-0 flex items-center gap-2 px-3 text-sm text-neutral-500">
                      <Spinner size="sm" /> Validating...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button onClick={requestWithdrawal} disabled={busy || !form.acctName} className="w-full">
            {busy ? <><Spinner size="sm" className="mr-2" /> Processing...</> : <><Send className="mr-2 h-4 w-4" /> Request Withdrawal</>}
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            OTP sent to {userEmail}. Enter it with your transfer PIN.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wd-otp" className="block text-sm font-medium text-neutral-700">OTP Code</label>
              <input id="wd-otp" type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} maxLength={6}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="wd-pin" className="block text-sm font-medium text-neutral-700">Transfer PIN</label>
              <input id="wd-pin" type="password" value={transferPin} onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, ""))} maxLength={4}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <Button onClick={confirmWithdrawal} disabled={busy} className="w-full">
            {busy ? <><Spinner size="sm" className="mr-2" /> Verifying...</> : "Confirm Withdrawal"}
          </Button>
        </div>
      )}
    </div>
  );
}
