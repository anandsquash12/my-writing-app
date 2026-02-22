"use client";

import { useState } from "react";
import { auth } from "../firebase/config";
import { fetchSignInMethodsForEmail, sendPasswordResetEmail } from "firebase/auth";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Email is required.");
      setMessage("");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      setMessage("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);

      if (methods.includes("google.com") && !methods.includes("password")) {
        setError("This email is registered using Google. Please login with Google.");
        return;
      }

      if (!methods.includes("password")) {
        setError("No email/password account found for this email.");
        return;
      }

      await sendPasswordResetEmail(auth, trimmedEmail);
      setMessage("Password reset link sent. Check your inbox.");
    } catch (resetError: any) {
      const code = resetError?.code;
      if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (code === "auth/invalid-credential") {
        setError("Unable to reset password for this account.");
      } else {
        setError(resetError.message || "Failed to send password reset email.");
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
