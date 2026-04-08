"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onValue, ref } from "firebase/database";
import { signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase/config";
import { ADMIN_EMAILS } from "../lib/admin";
import { withAvatarVersion } from "../lib/avatar";
import UserAvatar from "./ui/UserAvatar";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/publish", label: "Start Writing" },
  { href: "/trending", label: "Trending" },
  { href: "/vault", label: "Vault" },
  { href: "/search", label: "Explore" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user?.uid || !db) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = onValue(ref(db, `notifications/${user.uid}`), (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      setUnreadCount(
        Object.values(data).filter((value) => {
          const source = (value || {}) as Record<string, unknown>;
          return source.read !== true;
        }).length,
      );
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      if (!auth) {
        return;
      }

      await signOut(auth);
      setShowMenu(false);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const avatarUrl = withAvatarVersion(profile.avatarURL, profile.avatarUpdatedAt);
  const displayName = profile.displayName || user?.displayName || "Profile";

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#09090b]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex flex-col">
            <span className="font-serif text-2xl font-semibold tracking-[0.12em] text-[#f3e8d0]">SHABADLOK</span>
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#b2a793]">Write. Share. Earn.</span>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? "bg-[#f0c18d] text-[#120f0c]"
                      : "text-[#d7cfbf] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/vault"
            className="hidden rounded-full border border-[#d6a56f]/30 px-4 py-2 text-sm font-medium text-[#f0c18d] transition hover:bg-[#d6a56f]/10 md:inline-flex"
          >
            Explore Writers Vault
          </Link>

          {user ? (
            <>
              {user.email && ADMIN_EMAILS.includes(user.email) ? (
                <Link
                  href="/admin"
                  className="hidden rounded-full border border-[#d6a56f]/30 px-4 py-2 text-sm font-medium text-[#f0c18d] transition hover:bg-[#d6a56f]/10 md:inline-flex"
                >
                  Admin
                </Link>
              ) : null}
              <Link
                href="/notifications"
                className="relative inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-[#f4efe5] transition hover:bg-white/10"
              >
                Inbox
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#f0c18d] px-1 text-[10px] font-bold text-[#140f0b]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu((current) => !current)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-left transition hover:bg-white/10"
                  type="button"
                >
                  <UserAvatar name={displayName} src={avatarUrl} size="sm" />
                  <span className="hidden text-sm font-medium text-[#efe8d7] sm:inline">{displayName}</span>
                </button>

                {showMenu ? (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-3xl border border-white/10 bg-[#141419] p-2 shadow-2xl">
                    <Link href="/profile" className="block rounded-2xl px-4 py-3 text-sm text-[#ece3d2] hover:bg-white/5" onClick={() => setShowMenu(false)}>
                      My Profile
                    </Link>
                    <Link href="/publish" className="block rounded-2xl px-4 py-3 text-sm text-[#ece3d2] hover:bg-white/5" onClick={() => setShowMenu(false)}>
                      Start Writing
                    </Link>
                    <Link href="/vault/create" className="block rounded-2xl px-4 py-3 text-sm text-[#ece3d2] hover:bg-white/5" onClick={() => setShowMenu(false)}>
                      Sell Premium Writing
                    </Link>
                    <Link href="/my-purchases" className="block rounded-2xl px-4 py-3 text-sm text-[#ece3d2] hover:bg-white/5" onClick={() => setShowMenu(false)}>
                      My Purchases
                    </Link>
                    <Link href="/chat" className="block rounded-2xl px-4 py-3 text-sm text-[#ece3d2] hover:bg-white/5" onClick={() => setShowMenu(false)}>
                      Messages
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="mt-2 w-full rounded-2xl border border-[#ff9e9e]/20 px-4 py-3 text-left text-sm text-[#ffb7b7] hover:bg-[#ff9e9e]/8"
                      type="button"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex rounded-full bg-[#f0c18d] px-4 py-2 font-medium text-[#140f0b] transition hover:opacity-90"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
        {navLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                active ? "bg-[#f0c18d] text-[#140f0b]" : "bg-white/5 text-[#d7cfbf]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
