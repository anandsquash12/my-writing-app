"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, runTransaction, set, update } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { database } from "../firebase/config";
import { ButtonSpinner } from "./ui/Loading";
import { MIN_WITHDRAWAL_AMOUNT, PAYOUT_REQUEST_STATUS } from "../lib/admin";

interface UserPayoutInfo {
  upiId: string;
  name: string;
}

interface PayoutRequest {
  id: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: number;
  upiId?: string;
  name?: string;
}

export default function EarningsTab() {
  const { user } = useAuth();
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [withdrawnAmount, setWithdrawnAmount] = useState(0);
  const [payoutInfo, setPayoutInfo] = useState<UserPayoutInfo>({ upiId: "", name: "" });
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);

  const userId = user?.uid;

  useEffect(() => {
    if (!userId || !database) {
      return;
    }

    const userRef = ref(database, `users/${userId}`);
    const unsubscribeUser = onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTotalEarnings(typeof data.totalEarnings === "number" ? data.totalEarnings : 0);
      setAvailableBalance(typeof data.availableBalance === "number" ? data.availableBalance : 0);
      setWithdrawnAmount(typeof data.withdrawnAmount === "number" ? data.withdrawnAmount : 0);

      const payoutData = data.payoutInfo || {};
      setPayoutInfo({
        upiId: typeof payoutData.upiId === "string" ? payoutData.upiId : "",
        name: typeof payoutData.name === "string" ? payoutData.name : "",
      });
    });

    const requestsRef = ref(database, "payoutRequests");
    const unsubscribeRequests = onValue(requestsRef, (snapshot) => {
      const raw = snapshot.val() || {};
      const allRequests: PayoutRequest[] = Object.entries(raw).map(([id, request]) => {
        const requestData = request as Record<string, unknown>;
        return {
          id,
          userId: typeof requestData.userId === "string" ? requestData.userId : "",
          amount: typeof requestData.amount === "number" ? requestData.amount : Number(requestData.amount) || 0,
          status: typeof requestData.status === "string" ? requestData.status : "pending",
          createdAt: typeof requestData.createdAt === "number" ? requestData.createdAt : Number(requestData.createdAt) || 0,
          upiId: typeof requestData.upiId === "string" ? requestData.upiId : "",
          name: typeof requestData.name === "string" ? requestData.name : "",
        };
      });

      setRequests(allRequests.filter((request) => request.userId === userId).sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => {
      unsubscribeUser();
      unsubscribeRequests();
    };
  }, [userId]);

  const pendingAmount = useMemo(
    () => requests.filter((request) => request.status === PAYOUT_REQUEST_STATUS.pending).reduce((sum, request) => sum + request.amount, 0),
    [requests],
  );

  const handleSavePayoutInfo = async () => {
    if (!userId || !database) {
      setErrorMessage("Unable to save payout info.");
      return;
    }

    if (!payoutInfo.upiId.trim() || !payoutInfo.name.trim()) {
      setErrorMessage("Please provide both UPI ID and payout name.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSavingInfo(true);

    try {
      await update(ref(database, `users/${userId}/payoutInfo`), {
        upiId: payoutInfo.upiId.trim(),
        name: payoutInfo.name.trim(),
      });
      setSuccessMessage("Payout details saved successfully.");
    } catch (error) {
      console.error("Failed to save payout info:", error);
      setErrorMessage("Failed to save payout details. Please try again.");
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleCreateWithdrawal = async () => {
    if (!userId || !database) {
      setErrorMessage("Unable to submit withdrawal request.");
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    if (!payoutInfo.upiId.trim() || !payoutInfo.name.trim()) {
      setErrorMessage("Please save payout details before requesting a withdrawal.");
      return;
    }

    if (withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
      setErrorMessage(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}.`);
      return;
    }

    if (withdrawAmount > availableBalance) {
      setErrorMessage("You cannot withdraw more than your available balance.");
      return;
    }

    setIsSubmittingWithdrawal(true);

    try {
      const requestRef = push(ref(database, "payoutRequests"));
      await set(requestRef, {
        userId,
        amount: withdrawAmount,
        status: PAYOUT_REQUEST_STATUS.pending,
        createdAt: Date.now(),
        upiId: payoutInfo.upiId.trim(),
        name: payoutInfo.name.trim(),
      });
      setWithdrawAmount(0);
      setSuccessMessage("Withdrawal request created successfully. Admin will review it shortly.");
    } catch (error) {
      console.error("Failed to create payout request:", error);
      setErrorMessage("Failed to create withdrawal request. Please try again.");
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-[30px] border border-white/10 bg-[#121218]/90 p-10 text-center">
        <p className="serif-display text-3xl text-[#f3ead9]">Sign in to manage your earnings</p>
        <p className="mt-3 text-sm text-[#a89f90]">Your creator balance, payout details, and withdrawal requests are visible only after login.</p>
        <Link href="/login" className="outline-link mt-6 inline-flex">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Creator wallet</p>
          <h2 className="serif-display mt-4 text-4xl text-[#f5efe2]">Earnings overview</h2>
          <p className="mt-3 text-sm leading-7 text-[#d2c8b7]">Your creator earnings from premium posts are stored securely in your account until you request a payout.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#a89f90]">Total earned</p>
              <p className="mt-3 text-3xl font-semibold text-[#f5efe2]">₹{totalEarnings}</p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#a89f90]">Available balance</p>
              <p className="mt-3 text-3xl font-semibold text-[#f0c18d]">₹{availableBalance}</p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#a89f90]">Withdrawn</p>
              <p className="mt-3 text-3xl font-semibold text-[#dff5e3]">₹{withdrawnAmount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Pending payout</p>
          <div className="mt-4 rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-[#d2c8b7]">Requests awaiting review by admin.</p>
            <p className="mt-4 text-3xl font-semibold text-[#f5efe2]">₹{pendingAmount}</p>
          </div>
          <p className="mt-5 text-sm text-[#b8ae9f]">Note: Approved withdrawals are processed manually via UPI.</p>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6 shadow-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Payout account</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#f5efe2]">UPI payout details</h3>
          </div>
          <button
            type="button"
            onClick={handleSavePayoutInfo}
            disabled={isSavingInfo}
            className="inline-flex items-center gap-2 rounded-full bg-[#f0c18d] px-4 py-2 text-sm font-semibold text-[#140f0b] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSavingInfo ? "Saving..." : "Save payout details"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm text-[#d2c8b7]">UPI ID</span>
            <input
              value={payoutInfo.upiId}
              onChange={(event) => setPayoutInfo((prev) => ({ ...prev, upiId: event.target.value }))}
              className="mt-2 w-full rounded-[20px] border border-white/10 bg-[#0f1015] px-4 py-3 text-sm text-[#f5efe2] outline-none focus:border-[#f0c18d]"
              placeholder="yourname@bank"
            />
          </label>
          <label className="block">
            <span className="text-sm text-[#d2c8b7]">Payee name</span>
            <input
              value={payoutInfo.name}
              onChange={(event) => setPayoutInfo((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-2 w-full rounded-[20px] border border-white/10 bg-[#0f1015] px-4 py-3 text-sm text-[#f5efe2] outline-none focus:border-[#f0c18d]"
              placeholder="Your full name"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Withdraw earnings</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#f5efe2]">Request payout</h3>
            </div>
            <p className="text-sm text-[#d2c8b7]">Minimum ₹{MIN_WITHDRAWAL_AMOUNT}</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_0.7fr]">
            <label className="block">
              <span className="text-sm text-[#d2c8b7]">Amount to withdraw</span>
              <input
                value={withdrawAmount || ""}
                onChange={(event) => setWithdrawAmount(Number(event.target.value))}
                type="number"
                min={MIN_WITHDRAWAL_AMOUNT}
                step={1}
                className="mt-2 w-full rounded-[20px] border border-white/10 bg-[#0f1015] px-4 py-3 text-sm text-[#f5efe2] outline-none focus:border-[#f0c18d]"
                placeholder="Enter amount"
              />
            </label>
            <button
              type="button"
              onClick={handleCreateWithdrawal}
              disabled={isSubmittingWithdrawal}
              className="inline-flex items-center justify-center rounded-full bg-[#f0c18d] px-5 py-3 text-sm font-semibold text-[#140f0b] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmittingWithdrawal ? <ButtonSpinner /> : "Submit request"}
            </button>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-[#0f1015]/80 p-4 text-sm text-[#d2c8b7]">
            <p>
              Withdrawal requests are reviewed by admin. Approved payouts are deducted from your available balance and sent via UPI manually.
            </p>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Your payout activity</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#f5efe2]">Request history</h3>

          <div className="mt-6 space-y-4">
            {requests.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0f1015]/80 p-5 text-sm text-[#b8ae9f]">No withdrawal requests yet. Create one to start your payout workflow.</div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="rounded-[24px] border border-white/10 bg-[#0f1015]/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#d2c8b7]">Requested ₹{request.amount}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#a89f90]">{new Date(request.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                        request.status === PAYOUT_REQUEST_STATUS.approved
                          ? "bg-[#9ddeaf]/15 text-[#dff5e3]"
                          : request.status === PAYOUT_REQUEST_STATUS.rejected
                          ? "bg-[#ff8f8f]/15 text-[#ffb7b7]"
                          : "bg-[#f0c18d]/15 text-[#f5efe2]"
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {errorMessage ? <p className="text-sm text-[#ffb7b7]">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-[#9ddeaf]">{successMessage}</p> : null}
    </div>
  );
}
