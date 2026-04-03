"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { onValue, ref } from "firebase/database";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase/config";
import { withAvatarVersion } from "../lib/avatar";
import UserAvatar from "./ui/UserAvatar";

export default function NavBar() {
  const { user, profile } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = onValue(ref(db, `notifications/${user.uid}`), (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      const nextUnreadCount = Object.values(data).filter((value) => {
        const source = (value || {}) as Record<string, unknown>;
        return source.read !== true;
      }).length;

      setUnreadCount(nextUnreadCount);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
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
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-4xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-black transition-colors hover:text-gray-700">
            ShabadLok
          </Link>

          <div className="hidden items-center space-x-8 md:flex">
            <Link href="/" className="font-medium text-gray-700 transition-colors hover:text-black">
              Home
            </Link>
            <Link href="/publish" className="font-medium text-gray-700 transition-colors hover:text-black">
              Create
            </Link>
            <Link href="/trending" className="font-medium text-gray-700 transition-colors hover:text-black">
              Trending
            </Link>
            <Link href="/vault" className="font-medium text-gray-700 transition-colors hover:text-black">
              Vault
            </Link>
            <Link href="/search" className="font-medium text-gray-700 transition-colors hover:text-black">
              Explore
            </Link>
            <Link href="/chat" className="font-medium text-gray-700 transition-colors hover:text-black">
              Chat
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link href="/notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                  Inbox
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </Link>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center space-x-2 transition-opacity hover:opacity-80"
                    type="button"
                  >
                    <UserAvatar name={displayName} src={avatarUrl} size="sm" />
                    <span className="hidden text-sm font-medium text-gray-700 sm:inline">{displayName}</span>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                      <Link
                        href="/profile"
                        className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setShowMenu(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setShowMenu(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/my-drafts"
                        className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setShowMenu(false)}
                      >
                        My Drafts
                      </Link>
                      <Link
                        href="/chat"
                        className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setShowMenu(false)}
                      >
                        Messages
                      </Link>
                      <Link
                        href="/notifications"
                        className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setShowMenu(false)}
                      >
                        Notifications
                      </Link>
                      <Link
                        href="/vault"
                        className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setShowMenu(false)}
                      >
                        Writers Vault
                      </Link>
                      <Link
                        href="/my-purchases"
                        className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setShowMenu(false)}
                      >
                        My Purchases
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full border-t border-gray-200 px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                        type="button"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login" className="rounded-full bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-900">
                Login
              </Link>
            )}
          </div>
        </div>

        <div className="mt-3 flex justify-around border-t border-gray-200 pt-3 md:hidden overflow-x-auto">
          <Link href="/" className="text-xs font-medium text-gray-700 hover:text-black whitespace-nowrap">
            Home
          </Link>
          <Link href="/publish" className="text-xs font-medium text-gray-700 hover:text-black whitespace-nowrap">
            Create
          </Link>
          <Link href="/trending" className="text-xs font-medium text-gray-700 hover:text-black whitespace-nowrap">
            Trending
          </Link>
          <Link href="/vault" className="text-xs font-medium text-gray-700 hover:text-black whitespace-nowrap">
            Vault
          </Link>
          <Link href="/search" className="text-xs font-medium text-gray-700 hover:text-black whitespace-nowrap">
            Explore
          </Link>
          <Link href="/chat" className="text-xs font-medium text-gray-700 hover:text-black whitespace-nowrap">
            Chat
          </Link>
          <Link href="/notifications" className="relative text-xs font-medium text-gray-700 hover:text-black whitespace-nowrap">
            Alerts
            {unreadCount > 0 ? <span className="absolute -right-3 -top-2 text-[10px] font-bold text-red-500">{unreadCount}</span> : null}
          </Link>
        </div>
      </div>
    </nav>
  );
}
