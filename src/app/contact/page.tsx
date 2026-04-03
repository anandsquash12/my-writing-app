import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact ShabadLok for partnerships, support, and feedback.",
  openGraph: {
    title: "Contact ShabadLok",
    description: "Contact ShabadLok for partnerships, support, and feedback.",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="stack">
      <h1 className="page-title">Contact</h1>
      <section className="card stack">
        <p className="muted-text" style={{ margin: 0 }}>
          We usually reply in 1-2 business days.
        </p>
        <form className="form-stack">
          <input type="text" className="input" placeholder="Your name" />
          <input type="email" className="input" placeholder="Email address" />
          <textarea className="textarea" placeholder="Your message" />
          <button type="button" className="primary-button">
            Send Message
          </button>
        </form>
      </section>
    </div>
  );
}
