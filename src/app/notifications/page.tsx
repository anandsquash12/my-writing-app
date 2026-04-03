"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase/config";

interface NotificationRecord {
  id: string;
  type: string;
  actorId: string;
  actorName: string;
  href: string;
  entityId: string;
  entityTitle: string;
  previewText: string;
  read: boolean;
  createdAt: number;
}

function notificationLabel(notification: NotificationRecord): string {
  if (notification.type === "message") {
    return `${notification.actorName} sent you a message`;
  }

  if (notification.type === "like") {
    return `${notification.actorName} liked ${notification.entityTitle || "your post"}`;
  }

  if (notification.type === "comment") {
    return `${notification.actorName} commented on ${notification.entityTitle || "your post"}`;
  }

  if (notification.type === "share") {
    return `${notification.actorName} shared ${notification.entityTitle || "your post"}`;
  }

  if (notification.type === "follow") {
    return `${notification.actorName || "Someone"} started following you`;
  }

  return "You have a new notification";
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        router.replace("/login");
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const notificationsRef = ref(db, `notifications/${user.uid}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      const items = Object.entries(data)
        .map(([id, value]) => {
          const source = (value || {}) as Record<string, unknown>;

          return {
            id,
            type: typeof source.type === "string" ? source.type : "",
            actorId: typeof source.actorId === "string" ? source.actorId : typeof source.followerId === "string" ? source.followerId : "",
            actorName:
              typeof source.actorName === "string"
                ? source.actorName
                : typeof source.followerName === "string"
                  ? source.followerName
                  : typeof source.commentAuthorName === "string"
                    ? source.commentAuthorName
                    : "Someone",
            href:
              typeof source.href === "string"
                ? source.href
                : typeof source.chatId === "string" && source.chatId
                  ? `/chat?chatId=${encodeURIComponent(source.chatId)}`
                  : typeof source.postId === "string" && source.postId
                    ? `/quotes/${source.postId}`
                    : "",
            entityId:
              typeof source.entityId === "string"
                ? source.entityId
                : typeof source.postId === "string"
                  ? source.postId
                  : "",
            entityTitle:
              typeof source.entityTitle === "string"
                ? source.entityTitle
                : typeof source.postTitle === "string"
                  ? source.postTitle
                  : "your post",
            previewText:
              typeof source.previewText === "string"
                ? source.previewText
                : typeof source.commentText === "string"
                  ? source.commentText
                  : "",
            read: source.read === true,
            createdAt: typeof source.createdAt === "number" ? source.createdAt : 0,
          } satisfies NotificationRecord;
        })
        .sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(items);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || notifications.length === 0) {
      return;
    }

    const unread = notifications.filter((item) => !item.read);
    if (unread.length === 0) {
      return;
    }

    const updates: Record<string, boolean> = {};
    unread.forEach((item) => {
      updates[`notifications/${user.uid}/${item.id}/read`] = true;
    });
    update(ref(db), updates).catch((error) => {
      console.error("Failed to mark notifications read:", error);
    });
  }, [notifications, user?.uid]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  if (loading) {
    return <div className="card">Loading notifications...</div>;
  }

  if (!user) {
    return <div className="card">Redirecting to login...</div>;
  }

  return (
    <div className="stack">
      <h1 className="page-title">Notifications</h1>
      <p className="muted-text" style={{ margin: 0 }}>
        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "All caught up"}
      </p>
      {notifications.length === 0 ? (
        <div className="card">No notifications yet.</div>
      ) : (
        <section className="post-list">
          {notifications.map((item) => (
            <article key={item.id} className={`card${item.read ? "" : " notification-unread"}`}>
              <p style={{ margin: 0 }}>
                <strong>{notificationLabel(item)}</strong>
              </p>
              {item.previewText ? (
                <p className="muted-text" style={{ margin: "6px 0 0" }}>
                  {item.previewText}
                </p>
              ) : null}
              <div className="mode-toggle" style={{ marginTop: 8 }}>
                {item.href ? (
                  <Link href={item.href} className="inline-link">
                    Open
                  </Link>
                ) : null}
                {item.type === "follow" && item.actorId ? (
                  <Link href={`/writers/${item.actorId}`} className="inline-link">
                    View profile
                  </Link>
                ) : null}
                <span className="muted-text">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown date"}</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
