import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Read how ShabadLok handles account data, writing content, and purchases.",
};

export default function PrivacyPage() {
  return (
    <div className="space-y-6 reading-page">
      <section className="rounded-[32px] border border-white/10 bg-[#121218]/92 p-8 shadow-2xl">
        <p className="hero-tag">Privacy policy</p>
        <h1 className="serif-display mt-4 text-5xl text-[#f5efe2]">Your writing and account data</h1>
        <p className="mt-4 text-sm leading-8 text-[#d2c8b7]">
          ShabadLok stores account details, profile information, writing content, and purchase records so the platform can provide publishing, discovery, and premium unlock features.
        </p>
      </section>

      <section className="card space-y-4">
        <p className="text-sm leading-7 text-[#d2c8b7]">Public posts are visible to everyone. Private posts, drafts, and purchases are intended for the account owner according to the current access rules.</p>
        <p className="text-sm leading-7 text-[#d2c8b7]">Payment processing is handled through Razorpay. ShabadLok does not store your full card or banking credentials on the app itself.</p>
        <p className="text-sm leading-7 text-[#d2c8b7]">If you need help with account deletion, content access, or privacy questions, contact us through the Contact page.</p>
      </section>
    </div>
  );
}
