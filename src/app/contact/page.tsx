import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact ShabadLok for support, partnerships, and creator questions.",
  openGraph: {
    title: "Contact ShabadLok",
    description: "Reach ShabadLok for support, partnerships, and creator help.",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#121218]/92 p-8 shadow-2xl">
        <p className="hero-tag">Support and partnerships</p>
        <h1 className="serif-display mt-4 text-5xl text-[#f5efe2]">Contact</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#d2c8b7]">
          Questions about publishing, purchases, or partnerships? We usually respond within 1 to 2 business days.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
        <div className="card">
          <form className="form-stack">
            <input type="text" className="input" placeholder="Your name" />
            <input type="email" className="input" placeholder="Email address" />
            <textarea className="textarea" placeholder="Tell us how we can help" />
            <button type="button" className="primary-button">
              Send Message
            </button>
          </form>
        </div>
        <div className="card space-y-4">
          <div>
            <p className="hero-tag">For creators</p>
            <p className="mt-2 text-sm leading-7 text-[#d2c8b7]">Need help with premium posts, payouts setup, or account access? Mention your username and we’ll respond faster.</p>
          </div>
          <div>
            <p className="hero-tag">For brands</p>
            <p className="mt-2 text-sm leading-7 text-[#d2c8b7]">Reach out for featured campaigns, writing contests, or partnership opportunities inside the Writers Vault.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
