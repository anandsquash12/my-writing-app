import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Shayari Hub and its mission to help writers publish and connect.",
  openGraph: {
    title: "About Shayari Hub",
    description: "Learn about Shayari Hub and its mission to help writers publish and connect.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="stack">
      <h1 className="page-title">About Shayari Hub</h1>
      <section className="card stack">
        <p>
          Shayari Hub is a writing-first community where poets and storytellers publish heartfelt lines, discover new
          voices, and build lasting creative identity.
        </p>
        <p className="muted-text" style={{ marginBottom: 0 }}>
          We focus on simple publishing, meaningful discovery, and consistent support for writers at every stage.
        </p>
      </section>
    </div>
  );
}
