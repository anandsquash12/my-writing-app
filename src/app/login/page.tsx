"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase/config";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/");
      }
    });

    return unsubscribe;
  }, [router]);

  const handleEmailSignUp = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setBusy(true);
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (error) {
      console.error("Email sign up failed:", error);
      const message = error instanceof Error ? error.message : "Sign up failed.";
      alert(message);
    } finally {
      setBusy(false);
    }
  };

  const handleEmailLogin = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setBusy(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (error) {
      console.error("Email login failed:", error);
      const message = error instanceof Error ? error.message : "Login failed.";
      alert(message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setBusy(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error) {
      console.error("Google login failed:", error);
      const message = error instanceof Error ? error.message : "Google login failed.";
      alert(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <h1 className="page-title">Login</h1>
      <section className="card">
        <p className="muted-text">Use email/password or continue with Google.</p>

        <form onSubmit={handleEmailLogin} className="form-stack">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
            required
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={busy} className="primary-button">
              {busy ? "Please wait..." : "Login"}
            </button>
            <button type="button" onClick={handleEmailSignUp} disabled={busy} className="secondary-button">
              Sign Up
            </button>
          </div>
        </form>

        <button onClick={handleGoogleLogin} disabled={busy} className="secondary-button" style={{ marginTop: 12 }}>
          Continue with Google
        </button>
      </section>
    </div>
  );
}

