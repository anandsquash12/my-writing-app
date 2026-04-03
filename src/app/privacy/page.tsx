import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Read how ShabadLok handles account and content data.",
};

export default function PrivacyPage() {
  return (
    <div className="stack reading-page">
      <h1 className="page-title">Privacy Policy</h1>
      <section className="card stack">
        <p>
          ShabadLok stores account profile data and writing activity to run publishing, discovery, and community
          features.
        </p>
        <p>
          Public posts are visible to everyone. Private posts and drafts are only available to the author according to
          current access controls.
        </p>
        <p className="muted-text" style={{ marginBottom: 0 }}>
          If you need account deletion or data help, contact us through the Contact page.
        </p>
      </section>
    </div>
  );
}
