export const ADMIN_EMAILS = [process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@gmail.com"];
export const MIN_WITHDRAWAL_AMOUNT = 100;
export const PAYOUT_REQUEST_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;
