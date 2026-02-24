"use client";

import { useState } from "react";
import { auth } from "../firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    const e = email.trim().toLowerCase();

    if (!e) {
      setError("Enter email");
      setMessage("");
      return;
    }

    if (!isValidEmail(e)) {
      setError("Enter a valid email");
      setMessage("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      await sendPasswordResetEmail(auth, e);
      setMessage("Password reset email sent.");
    } catch (resetError: any) {
      const code = resetError?.code;
      if (code === "auth/invalid-email") {
        setError("Enter a valid email.");
      } else if (code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Try later.");
      } else {
        setError(resetError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <h1 className="page-title">Reset Password</h1>
      <section className="card">
        <form onSubmit={handleReset} className="form-stack">
          {error ? <p className="form-error">{error}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            className="input"
            disabled={loading}
          />
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </section>
    </div>
  );
}
