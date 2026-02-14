import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body style={{ fontFamily: "Arial" }}>
        <nav
          style={{
            padding: 15,
            borderBottom: "1px solid #ccc",
            marginBottom: 20,
          }}
        >
          <Link href="/" style={{ marginRight: 15 }}>Home</Link>
          <Link href="/create" style={{ marginRight: 15 }}>Add Post</Link>
          <Link href="/search">Search</Link>
        </nav>

        {children}
      </body>
    </html>
  );
}

