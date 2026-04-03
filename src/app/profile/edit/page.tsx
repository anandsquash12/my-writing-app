"use client";

import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase/config";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        router.replace("/login");
        return;
      }
      setUser(currentUser);
      try {
        const snapshot = await get(ref(db, `users/${currentUser.uid}`));
        const data = (snapshot.val() || {}) as Record<string, unknown>;
        const savedDisplayName = typeof data.displayName === "string" ? data.displayName.trim() : "";
        setDisplayName(savedDisplayName || currentUser.displayName || currentUser.email || "");
        setBio(typeof data.bio === "string" ? data.bio : "");
        setIsPrivateAccount(data.isPrivateAccount === true);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    const nextDisplayName = displayName.trim();
    if (!nextDisplayName) {
      alert("Display name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      await updateProfile(user, {
        displayName: nextDisplayName,
      });
      await update(ref(db, `users/${user.uid}`), {
        displayName: nextDisplayName,
        bio: bio.trim(),
        isPrivateAccount,
        updatedAt: Date.now(),
      });
      router.push("/profile");
      router.refresh();
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card">Loading profile...</div>;
  }

  if (!user) {
    return <div className="card">Redirecting to login...</div>;
  }

  return (
    <div className="stack reading-page">
      <h1 className="page-title">Edit Profile</h1>
      <section className="card">
        <form onSubmit={handleSubmit} className="form-stack">
          <label htmlFor="display-name" className="muted-text">
            Display Name
          </label>
          <input
            id="display-name"
            className="input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Enter your display name"
            maxLength={40}
          />
          <label htmlFor="bio" className="muted-text">
            Bio
          </label>
          <textarea
            id="bio"
            className="textarea"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Write a short intro about yourself."
          />
          <label className="checkbox-row switch-row">
            <input
              type="checkbox"
              checked={isPrivateAccount}
              onChange={(event) => setIsPrivateAccount(event.target.checked)}
              className="switch-input"
            />
            <span>Private account</span>
          </label>
          <div className="mode-toggle">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" className="secondary-button" onClick={() => router.push("/profile")} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
