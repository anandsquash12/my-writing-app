"use client";

import Link from "next/link";
import { onValue, ref } from "firebase/database";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase/config";

interface ReportItem {
  postId: string;
  reportId: string;
  fromUid: string;
  reason: string;
  createdAt: number;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    const reportsRef = ref(db, "reports");
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, Record<string, Record<string, unknown>>>;
      const next: ReportItem[] = [];

      Object.entries(data).forEach(([postId, entries]) => {
        Object.entries(entries || {}).forEach(([reportId, value]) => {
          next.push({
            postId,
            reportId,
            fromUid: typeof value.fromUid === "string" ? value.fromUid : "",
            reason: typeof value.reason === "string" ? value.reason : "",
            createdAt: typeof value.createdAt === "number" ? value.createdAt : 0,
          });
        });
      });

      setReports(next.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => unsubscribe();
  }, []);

  const totalReports = useMemo(() => reports.length, [reports]);

  return (
    <div className="stack">
      <h1 className="page-title">Admin Reports</h1>
      <p className="muted-text" style={{ margin: 0 }}>
        Total reports: {totalReports}
      </p>

      {reports.length === 0 ? (
        <div className="card">No reports found.</div>
      ) : (
        <section className="post-list">
          {reports.map((item) => (
            <article key={`${item.postId}-${item.reportId}`} className="card stack">
              <p style={{ margin: 0 }}>
                <strong>Post:</strong>{" "}
                <Link href={`/quotes/${item.postId}`} className="inline-link">
                  {item.postId}
                </Link>
              </p>
              <p style={{ margin: 0 }}>
                <strong>From UID:</strong> {item.fromUid || "Unknown"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Reason:</strong> {item.reason || "No reason"}
              </p>
              <p className="muted-text" style={{ margin: 0 }}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown date"}
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

