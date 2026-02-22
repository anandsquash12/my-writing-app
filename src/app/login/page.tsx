"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase/config";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      alert("Email and password required");
      return;
    }

    try {
      setLoading(true);
      const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);

      if (methods.includes("google.com") && !methods.includes("password")) {
        alert("This email is registered using Google. Please login with Google.");
        return;
      }

      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      router.push("/");
    } catch (error: any) {
      const code = error?.code;
      if (code === "auth/invalid-credential" || code === "auth/user-not-found") {
        alert("Invalid email or password.");
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      alert("Email and password required");
      return;
    }

    try {
      setLoading(true);
      const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);

      if (methods.includes("google.com") && !methods.includes("password")) {
        alert("This email is registered using Google. Please login with Google.");
        return;
      }

      if (methods.includes("password")) {
        alert("Email already registered. Please log in.");
        return;
      }

      await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      router.push("/");
    } catch (error: any) {
      const code = error?.code;
      if (code === "auth/email-already-in-use") {
        alert("Email already registered. Please log in.");
      } else if (code === "auth/weak-password") {
        alert("Password should be at least 6 characters.");
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
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
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Login</h1>

      <div className="flex gap-2 w-80">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`p-2 rounded flex-1 ${mode === "login" ? "bg-black text-white" : "bg-gray-200"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`p-2 rounded flex-1 ${mode === "register" ? "bg-black text-white" : "bg-gray-200"}`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 w-80">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white p-2 rounded"
        >
          {loading ? "Please wait..." : mode === "login" ? "Login with Email" : "Register with Email"}
        </button>
      </form>

      <button
        onClick={handleGoogleLogin}
        className="bg-red-500 text-white p-2 rounded w-80"
      >
        Login with Google
      </button>
    </div>
  );
}
