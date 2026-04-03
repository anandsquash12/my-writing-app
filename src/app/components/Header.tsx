"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { auth, database } from "../firebase/config";
import { signOut } from "firebase/auth";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./ui/UserAvatar";
import { withAvatarVersion } from "../lib/avatar";

interface NavLinkItem {
  label: string;
  href: string;
}

export default function Header() {
  const pathname = usePathname();
  const { user, loading, profile } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const desktopLinks: NavLinkItem[] = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Explore", href: "/quotes" },
      { label: "Studio", href: "/studio" },
      { label: "Confessions", href: "/confessions" },
      { label: "Trending", href: "/trending" },
      { label: "Search", href: "/search" },
    ],
    [],
  );

  const accountLinks: NavLinkItem[] = useMemo(
    () => [
      { label: "Profile", href: "/profile" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "My Drafts", href: "/my-drafts" },
      { label: "My Private", href: "/my-private" },
      { label: "Notifications", href: "/notifications" },
    ],
    [],
  );

  useEffect(() => {
    if (!user?.uid) {
      setUnreadNotifications(0);
      return;
    }

    const notificationsRef = ref(database, `notifications/${user.uid}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      const unread = Object.values(data).filter((value) => {
        const source = (value || {}) as Record<string, unknown>;
        return source.read !== true;
      }).length;
      setUnreadNotifications(unread);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setShowMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setShowMenu(false);
    setShowMobileMenu(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowMenu(false);
      setShowMobileMenu(false);
    } catch (error) {
      console.error("Logout failed:", error);
      const message = error instanceof Error ? error.message : "Failed to log out.";
      alert(message);
    }
  };

  const avatarSrc = withAvatarVersion(profile.avatarURL, profile.avatarUpdatedAt);
  const displayName = profile.displayName || user?.displayName || "";
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="app-nav-shell">
      <nav className="app-nav">
        <div className="nav-left">
          <button
            type="button"
            className="menu-toggle mobile-only"
            onClick={() => setShowMobileMenu((value) => !value)}
            aria-expanded={showMobileMenu}
            aria-controls="mobile-nav-drawer"
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
          <Link href="/" className="brand-link">
            ShabadLok
          </Link>
        </div>

        <div className="nav-center desktop-only">
          {desktopLinks.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link${isActive(item.href) ? " nav-link-active" : ""}`}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="nav-right">
          {loading ? null : user ? (
            <Link href="/create" className={`primary-button nav-cta${isActive("/create") ? " nav-cta-active" : ""}`}>
              Create
            </Link>
          ) : (
            <Link href="/login" className={`primary-button nav-cta${isActive("/login") ? " nav-cta-active" : ""}`}>
              Login
            </Link>
          )}

          {loading || !user ? null : (
            <div className="account-menu" ref={accountMenuRef}>
              <button
                type="button"
                className="account-toggle"
                onClick={() => setShowMenu((value) => !value)}
                aria-expanded={showMenu}
                aria-controls="account-menu-dropdown"
              >
                <UserAvatar name={displayName || "User"} src={avatarSrc} size="sm" />
                {unreadNotifications > 0 ? <span className="notification-dot">{unreadNotifications}</span> : null}
              </button>

              {showMenu ? (
                <div id="account-menu-dropdown" className="nav-dropdown">
                  {accountLinks.map((item) => (
                    <Link key={item.href} href={item.href} className={`dropdown-link${isActive(item.href) ? " dropdown-link-active" : ""}`}>
                      {item.label}
                    </Link>
                  ))}
                  <button onClick={handleLogout} className="dropdown-button" type="button">
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </nav>

      {showMobileMenu ? (
        <div id="mobile-nav-drawer" className="mobile-drawer" ref={mobileMenuRef}>
          <div className="mobile-links">
            {desktopLinks.map((item) => (
              <Link key={item.href} href={item.href} className={`mobile-link${isActive(item.href) ? " mobile-link-active" : ""}`}>
                {item.label}
              </Link>
            ))}
          </div>

          {loading ? null : user ? (
            <div className="mobile-account-section">
              <Link href="/create" className={`mobile-link${isActive("/create") ? " mobile-link-active" : ""}`}>
                Create
              </Link>
              <p className="muted-text" style={{ margin: 0 }}>
                Account
              </p>
              <div className="mobile-account-links">
                {accountLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={`mobile-link${isActive(item.href) ? " mobile-link-active" : ""}`}>
                    {item.label}
                  </Link>
                ))}
                <button onClick={handleLogout} className="mobile-link mobile-link-button" type="button">
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className={`mobile-link${isActive("/login") ? " mobile-link-active" : ""}`}>
              Login
            </Link>
          )}
        </div>
      ) : null}
    </header>
  );
}
