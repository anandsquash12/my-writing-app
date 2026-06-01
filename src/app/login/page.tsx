"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (mode === "register" && !displayName.trim()) {
      setErrorMessage("Please enter your display name.");
      return;
    }

    setLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      displayName: mode === "register" ? displayName : undefined,
    });

    setLoading(false);

    if (result?.error) {
      setErrorMessage(result.error || "Authentication failed.");
      return;
    }

    if (mode === "register") {
      setSuccessMessage("Account created. Redirecting to home...");
      setTimeout(() => router.push("/"), 1200);
      return;
    }

    if (result?.ok) {
      router.push("/");
    }
  };

  const handleGoogleLogin = async () => {
    clearMessages();
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
    setGoogleLoading(false);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-[#e7dccd] bg-[#faf7f2] p-8 shadow-sm">
        <div className="space-y-3">
          <p className="hero-tag" style={{ color: "#8a5a0a" }}>
            Welcome back to ShabadLok
          </p>
          <h1 className="serif-display text-4xl font-semibold text-[#1a1209]">{mode === "login" ? "Sign In" : "Create an account"}</h1>
          <p className="max-w-2xl text-sm leading-7 text-[#6b5e4a]">
            {mode === "login"
              ? "Login with Google or email and password to unlock writing, publishing, and premium content."
              : "Register to save drafts and publish your writing to the ShabadLok community."}
          </p>
        </div>
      </section>

      <div className="rounded-[28px] border border-[#e7dccd] bg-white p-8 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode("login");
            }}
            className={mode === "login" ? "primary-button" : "secondary-button"}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode("register");
            }}
            className={mode === "register" ? "primary-button" : "secondary-button"}
          >
            Register
          </button>
        </div>

        {errorMessage ? <p className="form-error mt-4">{errorMessage}</p> : null}
        {successMessage ? <p className="form-success mt-4">{successMessage}</p> : null}

        <form onSubmit={handleEmailSubmit} className="mt-6 grid gap-4">
          {mode === "register" ? (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="input"
              disabled={loading || googleLoading}
            />
          ) : null}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
            disabled={loading || googleLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
            disabled={loading || googleLoading}
          />
          <button type="submit" className="primary-button" disabled={loading || googleLoading}>
            {loading ? "Please wait..." : mode === "login" ? "Login with Email" : "Register with Email"}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-sm text-[#6b5e4a]">
          <Link href="/reset-password" className="inline-link">
            Forgot password?
          </Link>
          <span>{mode === "login" ? "Sign in with Google for faster access." : "Use your email to create a new account."}</span>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e7dccd] bg-[#faf7f2] p-8 shadow-sm">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="primary-button inline-flex items-center justify-center gap-3"
          disabled={googleLoading}
        >
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
