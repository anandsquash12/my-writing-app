import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Shayari Hub for partnerships, support, and feedback.",
  openGraph: {
    title: "Contact Shayari Hub",
    description: "Contact Shayari Hub for partnerships, support, and feedback.",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="stack">
      <h1 className="page-title">Contact</h1>
      <section className="card stack">
        <p>For support, collaboration, or feedback, reach us at:</p>
        <p style={{ margin: 0 }}>
          <strong>Email:</strong> hello@shayarihub.example
        </p>
        <p style={{ margin: 0 }}>
          <strong>Response time:</strong> 1-2 business days
        </p>
      </section>
    </div>
  );
}
