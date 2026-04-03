"use client";

import { useMemo, useState } from "react";

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  createdAt: number;
  read?: boolean;
}

interface NotificationBellProps {
  items: NotificationItem[];
  onClear?: () => void;
}

export default function NotificationBell({ items, onClear }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.createdAt - a.createdAt),
    [items],
  );

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="relative rounded-full border border-white/25 bg-black/50 p-2 text-white transition hover:bg-white/10 focus:outline-none"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold leading-none">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-white/20 bg-gray-900 p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Notifications</span>
            <button
              type="button"
              className="text-xs text-gray-400 hover:text-white"
              onClick={() => {
                setOpen(false);
                onClear?.();
              }}
            >
              Clear
            </button>
          </div>

          {sorted.length === 0 ? (
            <p className="text-sm text-gray-400">No notifications yet.</p>
          ) : (
            <ul className="space-y-2">
              {sorted.slice(0, 6).map((item) => (
                <li key={item.id} className="rounded-lg bg-black/70 p-2 text-sm">
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-gray-300">{item.subtitle}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
