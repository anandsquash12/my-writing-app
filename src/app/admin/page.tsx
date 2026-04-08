"use client";

import { useEffect, useMemo, useState } from "react";
import { remove, onValue, ref, update, runTransaction } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { database } from "../firebase/config";
import { ADMIN_EMAILS, PAYOUT_REQUEST_STATUS } from "../lib/admin";

interface PayoutRequest {
  id: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: number;
  upiId?: string;
  name?: string;
}

interface UserRecord {
  id: string;
  email?: string;
  name?: string;
  totalEarnings?: number;
  availableBalance?: number;
  withdrawnAmount?: number;
  isBanned?: boolean;
  payoutInfo?: { upiId?: string; name?: string };
}

interface PostRecord {
  id: string;
  title?: string;
  userId?: string;
  authorName?: string;
  createdAt?: number;
}

interface QuoteRecord extends PostRecord {
  text?: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "payouts" | "content" | "users">("overview");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [premiumPosts, setPremiumPosts] = useState<PostRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [platformStats, setPlatformStats] = useState({ totalRevenue: 0, totalCommission: 0, totalPayouts: 0 });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isAdmin = Boolean(user?.email && ADMIN_EMAILS.includes(user.email));

  useEffect(() => {
    if (!isAdmin || !database) {
      return;
    }

    const usersRef = ref(database, "users");
    const stopUsers = onValue(usersRef, (snapshot) => {
      const raw = snapshot.val() || {};
      const mapped = Object.entries(raw).map(([id, item]) => {
        const userData = item as Record<string, unknown>;
        return {
          id,
          email: typeof userData.email === "string" ? userData.email : undefined,
          name: typeof userData.name === "string" ? userData.name : undefined,
          totalEarnings: typeof userData.totalEarnings === "number" ? userData.totalEarnings : 0,
          availableBalance: typeof userData.availableBalance === "number" ? userData.availableBalance : 0,
          withdrawnAmount: typeof userData.withdrawnAmount === "number" ? userData.withdrawnAmount : 0,
          isBanned: userData.isBanned === true,
          payoutInfo: typeof userData.payoutInfo === "object" && userData.payoutInfo !== null ? (userData.payoutInfo as Record<string, unknown>) : undefined,
        };
      });
      setUsers(mapped);
    });

    const premiumPostsRef = ref(database, "premiumPosts");
    const stopPremiumPosts = onValue(premiumPostsRef, (snapshot) => {
      const raw = snapshot.val() || {};
      const mapped = Object.entries(raw).map(([id, item]) => {
        const postData = item as Record<string, unknown>;
        return {
          id,
          title: typeof postData.title === "string" ? postData.title : undefined,
          userId: typeof postData.userId === "string" ? postData.userId : undefined,
          authorName: typeof postData.authorName === "string" ? postData.authorName : undefined,
          createdAt: typeof postData.createdAt === "number" ? postData.createdAt : 0,
        };
      });
      setPremiumPosts(mapped);
    });

    const quotesRef = ref(database, "quotes");
    const stopQuotes = onValue(quotesRef, (snapshot) => {
      const raw = snapshot.val() || {};
      const mapped = Object.entries(raw).map(([id, item]) => {
        const quoteData = item as Record<string, unknown>;
        return {
          id,
          title: typeof quoteData.title === "string" ? quoteData.title : typeof quoteData.text === "string" ? quoteData.text.slice(0, 40) : undefined,
          userId: typeof quoteData.authorId === "string" ? quoteData.authorId : undefined,
          createdAt: typeof quoteData.createdAt === "number" ? quoteData.createdAt : 0,
          text: typeof quoteData.text === "string" ? quoteData.text : undefined,
        };
      });
      setQuotes(mapped);
    });

    const requestsRef = ref(database, "payoutRequests");
    const stopRequests = onValue(requestsRef, (snapshot) => {
      const raw = snapshot.val() || {};
      const mapped = Object.entries(raw)
        .map(([id, item]) => {
          const requestData = item as Record<string, unknown>;
          return {
            id,
            userId: typeof requestData.userId === "string" ? requestData.userId : "",
            amount: typeof requestData.amount === "number" ? requestData.amount : Number(requestData.amount) || 0,
            status: typeof requestData.status === "string" ? requestData.status : "pending",
            createdAt: typeof requestData.createdAt === "number" ? requestData.createdAt : Number(requestData.createdAt) || 0,
            upiId: typeof requestData.upiId === "string" ? requestData.upiId : undefined,
            name: typeof requestData.name === "string" ? requestData.name : undefined,
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
      setRequests(mapped);
    });

    const statsRef = ref(database, "platformStats");
    const stopStats = onValue(statsRef, (snapshot) => {
      const raw = snapshot.val() || {};
      setPlatformStats({
        totalRevenue: typeof raw.totalRevenue === "number" ? raw.totalRevenue : 0,
        totalCommission: typeof raw.totalCommission === "number" ? raw.totalCommission : 0,
        totalPayouts: typeof raw.totalPayouts === "number" ? raw.totalPayouts : 0,
      });
    });

    return () => {
      stopUsers();
      stopPremiumPosts();
      stopQuotes();
      stopRequests();
      stopStats();
    };
  }, [isAdmin]);

  const totalPosts = useMemo(() => quotes.length + premiumPosts.length, [quotes.length, premiumPosts.length]);
  const totalUsers = users.length;

  const requestUsers = useMemo(
    () =>
      requests.map((request) => ({
        ...request,
        user: users.find((userRecord) => userRecord.id === request.userId),
      })),
    [requests, users],
  );

  const handleApprove = async (request: PayoutRequest) => {
    if (!database || !user) {
      setErrorMessage("Unable to approve request.");
      return;
    }

    try {
      const requestRef = ref(database, `payoutRequests/${request.id}`);
      await update(requestRef, { status: PAYOUT_REQUEST_STATUS.approved });

      const availableRef = ref(database, `users/${request.userId}/availableBalance`);
      await runTransaction(availableRef, (current) => {
        const currentValue = typeof current === "number" ? current : 0;
        return Math.max(currentValue - request.amount, 0);
      });

      const withdrawnRef = ref(database, `users/${request.userId}/withdrawnAmount`);
      await runTransaction(withdrawnRef, (current) => {
        const currentValue = typeof current === "number" ? current : 0;
        return currentValue + request.amount;
      });

      const payoutStatsRef = ref(database, "platformStats/totalPayouts");
      await runTransaction(payoutStatsRef, (current) => {
        const currentValue = typeof current === "number" ? current : 0;
        return currentValue + request.amount;
      });

      setSuccessMessage(`Approved payout request for ₹${request.amount}.`);
      setErrorMessage("");
    } catch (error) {
      console.error("Approve payout failed:", error);
      setErrorMessage("Failed to approve payout request.");
      setSuccessMessage("");
    }
  };

  const handleReject = async (request: PayoutRequest) => {
    if (!database) {
      setErrorMessage("Unable to reject request.");
      return;
    }

    try {
      const requestRef = ref(database, `payoutRequests/${request.id}`);
      await update(requestRef, { status: PAYOUT_REQUEST_STATUS.rejected });
      setSuccessMessage(`Rejected payout request for ₹${request.amount}.`);
      setErrorMessage("");
    } catch (error) {
      console.error("Reject payout failed:", error);
      setErrorMessage("Failed to reject payout request.");
      setSuccessMessage("");
    }
  };

  const handleDeletePremiumPost = async (postId: string) => {
    if (!database) {
      setErrorMessage("Unable to delete premium post.");
      return;
    }

    try {
      await remove(ref(database, `premiumPosts/${postId}`));
      setSuccessMessage("Premium post deleted successfully.");
      setErrorMessage("");
    } catch (error) {
      console.error("Delete premium post failed:", error);
      setErrorMessage("Failed to delete premium post.");
      setSuccessMessage("");
    }
  };

  const handleDeleteQuotePost = async (postId: string) => {
    if (!database) {
      setErrorMessage("Unable to delete post.");
      return;
    }

    try {
      await remove(ref(database, `quotes/${postId}`));
      setSuccessMessage("Post deleted successfully.");
      setErrorMessage("");
    } catch (error) {
      console.error("Delete post failed:", error);
      setErrorMessage("Failed to delete post.");
      setSuccessMessage("");
    }
  };

  const toggleBanUser = async (userRecord: UserRecord) => {
    if (!database) {
      setErrorMessage("Unable to update user.");
      return;
    }

    try {
      await update(ref(database, `users/${userRecord.id}`), {
        isBanned: userRecord.isBanned ? false : true,
      });
      setSuccessMessage(userRecord.isBanned ? "User unbanned successfully." : "User banned successfully.");
      setErrorMessage("");
    } catch (error) {
      console.error("Toggle ban failed:", error);
      setErrorMessage("Failed to update user status.");
      setSuccessMessage("");
    }
  };

  if (!user) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#121218]/92 p-10 text-center shadow-2xl">
        <p className="serif-display text-4xl text-[#f5efe2]">Admin access required</p>
        <p className="mt-3 text-sm text-[#a89f90]">Please sign in using an admin account to access the dashboard.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#121218]/92 p-10 text-center shadow-2xl">
        <p className="serif-display text-4xl text-[#f5efe2]">Access denied</p>
        <p className="mt-3 text-sm text-[#a89f90]">This page is only available to platform administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[34px] border border-white/10 bg-[#121218]/95 p-8 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#aa9f8f]">Admin dashboard</p>
            <h1 className="serif-display mt-3 text-5xl text-[#f5efe2]">Platform control center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#d2c8b7]">Approve payouts, moderate premium content, and keep creator earnings flowing smoothly.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {(["overview", "payouts", "content", "users"] as const).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                activeTab === tabKey ? "bg-[#f0c18d] text-[#140f0b]" : "bg-white/5 text-[#e8dfcf] hover:bg-white/10"
              }`}
            >
              {tabKey === "overview"
                ? "Overview"
                : tabKey === "payouts"
                ? "Payout requests"
                : tabKey === "content"
                ? "Content moderation"
                : "Users"}
            </button>
          ))}
        </div>
      </section>

      {errorMessage ? <div className="rounded-[24px] border border-[#ff8f8f]/30 bg-[#2f1515] p-4 text-sm text-[#ffb7b7]">{errorMessage}</div> : null}
      {successMessage ? <div className="rounded-[24px] border border-[#9ddeaf]/30 bg-[#182a18] p-4 text-sm text-[#dff5e3]">{successMessage}</div> : null}

      {activeTab === "overview" ? (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Users</p>
            <p className="mt-4 text-4xl font-semibold text-[#f5efe2]">{totalUsers}</p>
            <p className="mt-2 text-sm text-[#d2c8b7]">Total registered users on the platform.</p>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Total posts</p>
            <p className="mt-4 text-4xl font-semibold text-[#f5efe2]">{totalPosts}</p>
            <p className="mt-2 text-sm text-[#d2c8b7]">Published quotes and premium posts combined.</p>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Premium posts</p>
            <p className="mt-4 text-4xl font-semibold text-[#f0c18d]">{premiumPosts.length}</p>
            <p className="mt-2 text-sm text-[#d2c8b7]">Active premium content items.</p>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Total revenue</p>
            <p className="mt-4 text-4xl font-semibold text-[#dff5e3]">₹{platformStats.totalRevenue}</p>
            <p className="mt-2 text-sm text-[#d2c8b7]">Total reader spend captured by the platform.</p>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Total commission</p>
            <p className="mt-4 text-4xl font-semibold text-[#f0c18d]">₹{platformStats.totalCommission}</p>
            <p className="mt-2 text-sm text-[#d2c8b7]">Platform earnings from premium licence sales.</p>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Total payouts</p>
            <p className="mt-4 text-4xl font-semibold text-[#9ddeaf]">₹{platformStats.totalPayouts}</p>
            <p className="mt-2 text-sm text-[#d2c8b7]">Total creator payouts approved so far.</p>
          </div>
        </section>
      ) : null}

      {activeTab === "payouts" ? (
        <section className="space-y-6">
          <div className="overflow-x-auto rounded-[30px] border border-white/10 bg-[#121218]/95 p-4">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-[#d2c8b7]">
              <thead>
                <tr>
                  <th className="border-b border-white/10 px-4 py-3">User</th>
                  <th className="border-b border-white/10 px-4 py-3">Amount</th>
                  <th className="border-b border-white/10 px-4 py-3">UPI ID</th>
                  <th className="border-b border-white/10 px-4 py-3">Status</th>
                  <th className="border-b border-white/10 px-4 py-3">Requested</th>
                  <th className="border-b border-white/10 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requestUsers.map((request) => (
                  <tr key={request.id} className="border-b border-white/10 last:border-none">
                    <td className="px-4 py-4 text-[#f5efe2]">{request.user?.name || request.user?.email || "Unknown"}</td>
                    <td className="px-4 py-4">₹{request.amount}</td>
                    <td className="px-4 py-4">{request.upiId || "—"}</td>
                    <td className="px-4 py-4 uppercase tracking-[0.16em] text-sm text-[#a89f90]">{request.status}</td>
                    <td className="px-4 py-4">{new Date(request.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-4 space-x-2">
                      {request.status === PAYOUT_REQUEST_STATUS.pending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleApprove(request)}
                            className="rounded-full bg-[#9ddeaf]/15 px-3 py-2 text-sm font-semibold text-[#dff5e3] transition hover:bg-[#9ddeaf]/25"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleReject(request)}
                            className="rounded-full bg-[#ff8f8f]/15 px-3 py-2 text-sm font-semibold text-[#ffb7b7] transition hover:bg-[#ff8f8f]/25"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "content" ? (
        <section className="space-y-8">
          <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Premium post moderation</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#f5efe2]">Premium posts</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {premiumPosts.length === 0 ? (
                <p className="text-sm text-[#b8ae9f]">No premium posts available.</p>
              ) : (
                premiumPosts.slice(0, 12).map((post) => (
                  <div key={post.id} className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-[#0f1015]/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-[#d2c8b7]">{post.authorName || "Unknown author"}</p>
                      <p className="mt-1 text-base font-semibold text-[#f5efe2]">{post.title || "Untitled premium post"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeletePremiumPost(post.id)}
                      className="rounded-full bg-[#ff8f8f]/15 px-4 py-2 text-sm font-semibold text-[#ffb7b7] transition hover:bg-[#ff8f8f]/25"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Post moderation</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#f5efe2]">Quotes & posts</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {quotes.length === 0 ? (
                <p className="text-sm text-[#b8ae9f]">No quote posts available.</p>
              ) : (
                quotes.slice(0, 12).map((post) => (
                  <div key={post.id} className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-[#0f1015]/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-[#d2c8b7]">{post.title || "Untitled post"}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#a89f90]">{new Date(post.createdAt || 0).toLocaleDateString("en-IN")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteQuotePost(post.id)}
                      className="rounded-full bg-[#ff8f8f]/15 px-4 py-2 text-sm font-semibold text-[#ffb7b7] transition hover:bg-[#ff8f8f]/25"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "users" ? (
        <section className="rounded-[30px] border border-white/10 bg-[#121218]/95 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">User management</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#f5efe2]">All creators & readers</h2>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm text-[#d2c8b7]">
              <thead>
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Withdrawn</th>
                  <th className="px-4 py-3">UPI</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((userRecord) => (
                  <tr key={userRecord.id}>
                    <td className="px-4 py-4 text-[#f5efe2]">{userRecord.name || userRecord.email || "Unknown"}</td>
                    <td className="px-4 py-4">₹{userRecord.availableBalance || 0}</td>
                    <td className="px-4 py-4">₹{userRecord.withdrawnAmount || 0}</td>
                    <td className="px-4 py-4">{userRecord.payoutInfo?.upiId || "—"}</td>
                    <td className="px-4 py-4">{userRecord.isBanned ? "Banned" : "Active"}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => void toggleBanUser(userRecord)}
                        className="rounded-full bg-[#f0c18d]/10 px-4 py-2 text-sm font-semibold text-[#f5efe2] transition hover:bg-[#f0c18d]/20"
                      >
                        {userRecord.isBanned ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
