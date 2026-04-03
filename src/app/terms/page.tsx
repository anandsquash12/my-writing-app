import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for ShabadLok.",
};

export default function TermsPage() {
  return (
    <div className="stack reading-page">
      <h1 className="page-title">Terms of Use</h1>
      <section className="card stack">
        <p>By using ShabadLok, you agree to post lawful content and respect other writers in the community.</p>
        <p>
          You are responsible for the content published from your account. Report tools are available for policy
          violations.
        </p>
        <p className="muted-text" style={{ marginBottom: 0 }}>
          These terms may be updated over time. Continued use means you accept the latest version.
        </p>
      </section>
    </div>
  );
}
