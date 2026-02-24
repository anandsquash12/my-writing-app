"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "../firebase/config";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    if (reason === "verify") {
      setErrorMessage("Please verify your email before accessing that page.");
    } else if (reason === "auth") {
      setErrorMessage("Please login to continue.");
    }
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const syncAuthCookies = (verified: boolean) => {
    document.cookie = "mw-auth=1; path=/; max-age=2592000; samesite=lax";
    document.cookie = `mw-verified=${verified ? "1" : "0"}; path=/; max-age=2592000; samesite=lax`;
  };

  const handleEmailLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      clearMessages();
      const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);

      if (methods.includes("google.com") && !methods.includes("password")) {
        setErrorMessage("This email is registered using Google. Please login with Google.");
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      await credential.user.reload();
      const currentUser = auth.currentUser;
      const usesPassword = credential.user.providerData.some((provider) => provider.providerId === "password");
      const isVerified = currentUser?.emailVerified ?? credential.user.emailVerified;

      if (usesPassword && !isVerified) {
        await signOut(auth);
        setPendingVerificationEmail(trimmedEmail);
        setErrorMessage("Email not verified. Please verify and try again.");
        return;
      }

      syncAuthCookies(true);
      router.push("/");
    } catch (error: any) {
      const code = error?.code;
      if (code === "auth/user-not-found") {
        setErrorMessage("No account found with this email.");
      } else if (code === "auth/wrong-password") {
        setErrorMessage("Incorrect password.");
      } else if (code === "auth/invalid-email") {
        setErrorMessage("Please enter a valid email address.");
      } else if (code === "auth/invalid-credential") {
        setErrorMessage("Invalid email or password.");
      } else {
        setErrorMessage(error.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      clearMessages();
      const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);

      if (methods.includes("google.com") && !methods.includes("password")) {
        setErrorMessage("This email is registered using Google. Please login with Google.");
        return;
      }

      if (methods.includes("password")) {
        setErrorMessage("Email already registered. Please log in.");
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      await sendEmailVerification(credential.user);
      setResendCooldown(60);
      await signOut(auth);
      setPendingVerificationEmail(trimmedEmail);
      setMode("login");
      setSuccessMessage("Account created. Verification email sent. Verify your email, then log in.");
    } catch (error: any) {
      const code = error?.code;
      if (code === "auth/email-already-in-use") {
        setErrorMessage("Email already registered. Please log in.");
      } else if (code === "auth/invalid-email") {
        setErrorMessage("Please enter a valid email address.");
      } else if (code === "auth/invalid-credential") {
        setErrorMessage("Invalid registration request.");
      } else if (code === "auth/weak-password") {
        setErrorMessage("Password should be at least 6 characters.");
      } else {
        setErrorMessage(error.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = (pendingVerificationEmail || email).trim();

    if (!targetEmail) {
      setErrorMessage("Enter your email first.");
      return;
    }

    if (!password) {
      setErrorMessage("Enter your password to resend verification email.");
      return;
    }

    if (!isValidEmail(targetEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (resendCooldown > 0) {
      setErrorMessage(`Please wait ${resendCooldown}s before resending verification email.`);
      return;
    }

    try {
      setResending(true);
      clearMessages();
      const methods = await fetchSignInMethodsForEmail(auth, targetEmail);

      if (methods.includes("google.com") && !methods.includes("password")) {
        setErrorMessage("This email is registered using Google. Please login with Google.");
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, targetEmail, password);
      await credential.user.reload();
      const currentUser = auth.currentUser ?? credential.user;
      if (currentUser.emailVerified) {
        await signOut(auth);
        setSuccessMessage("Email already verified.");
        return;
      }

      await sendEmailVerification(currentUser);
      setResendCooldown(60);
      await signOut(auth);
      setPendingVerificationEmail(targetEmail);
      setSuccessMessage("Verification email sent.");
    } catch (error: any) {
      const code = error?.code;
      if (code === "auth/user-not-found") {
        setErrorMessage("No account found.");
      } else if (code === "auth/wrong-password") {
        setErrorMessage("Incorrect password.");
      } else if (code === "auth/invalid-email") {
        setErrorMessage("Invalid email format.");
      } else if (code === "auth/invalid-credential") {
        setErrorMessage("Invalid email or password.");
      } else {
        setErrorMessage(error.message || "Failed to resend verification email.");
      }
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async () => {
    const e = email.trim().toLowerCase();

    if (!e) {
      setErrorMessage("Enter email");
      return;
    }

    if (!isValidEmail(e)) {
      setErrorMessage("Enter a valid email");
      return;
    }

    try {
      setResetting(true);
      clearMessages();
      await sendPasswordResetEmail(auth, e);
      setSuccessMessage("Password reset email sent.");
    } catch (error: any) {
      const code = error?.code;
      if (code === "auth/invalid-email") {
        setErrorMessage("Enter a valid email.");
      } else if (code === "auth/user-not-found") {
        setErrorMessage("No account found with this email.");
      } else if (code === "auth/too-many-requests") {
        setErrorMessage("Too many attempts. Try later.");
      } else {
        setErrorMessage(error.message);
      }
    } finally {
      setResetting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      await handleEmailLogin();
      return;
    }
    await handleEmailRegister();
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      clearMessages();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      syncAuthCookies(true);
      router.push("/");
    } catch (error: any) {
      setErrorMessage(error.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <h1 className="page-title">Login</h1>

      <div className="card form-stack">
        <div className="mode-toggle">
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode("login");
            }}
            className={mode === "login" ? "primary-button" : "secondary-button"}
            disabled={loading || resending || resetting}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode("register");
            }}
            className={mode === "register" ? "primary-button" : "secondary-button"}
            disabled={loading || resending || resetting}
          >
            Register
          </button>
        </div>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        {successMessage ? <p className="form-success">{successMessage}</p> : null}

        <form onSubmit={handleEmailSubmit} className="form-stack">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            disabled={loading || resending || resetting}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            disabled={loading || resending || resetting}
          />

          <button type="submit" disabled={loading || resending || resetting} className="primary-button">
            {loading ? "Please wait..." : mode === "login" ? "Login with Email" : "Register with Email"}
          </button>
        </form>

        {mode === "login" ? (
          <div className="mode-toggle">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetting || loading || resending}
              className="secondary-button"
            >
              {resetting ? "Sending reset link..." : "Quick Reset"}
            </button>
            <Link href="/reset-password" className="inline-link" style={{ alignSelf: "center" }}>
              Open Reset Page
            </Link>
          </div>
        ) : null}

        {mode === "login" ? (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending || loading || resetting || resendCooldown > 0}
            className="secondary-button"
          >
            {resending ? "Resending..." : resendCooldown > 0 ? `Resend Verification Email (${resendCooldown}s)` : "Resend Verification Email"}
          </button>
        ) : null}
      </div>

      <div className="card form-stack">
        <button onClick={handleGoogleLogin} className="primary-button" disabled={loading || resending || resetting}>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
