"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      const message = error instanceof Error ? error.message : "Failed to log out.";
      alert(message);
    }
  };

  return (
    <nav className="app-nav">
      <div className="nav-left">
        <Link href="/" className="brand-link">
          Shayari Hub
        </Link>
        <Link href="/" className="nav-link">
          Home
        </Link>
        <Link href="/create" className="nav-link">
          Create
        </Link>
        <Link href="/search" className="nav-link">
          Search
        </Link>
        {loading ? null : user ? (
          <Link href="/profile" className="nav-link">
            Profile
          </Link>
        ) : null}
      </div>

      <div className="nav-right">
        {loading ? null : user ? (
          <>
            <span className="muted-text">{user.displayName || user.email}</span>
            <button onClick={handleLogout} className="secondary-button">
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="primary-link">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

