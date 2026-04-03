"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, database } from "../firebase/config";

interface AuthProfile {
  displayName: string;
  avatarURL: string;
  avatarUpdatedAt: number;
  isPrivateAccount: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  profile: AuthProfile;
}

const defaultProfile: AuthProfile = {
  displayName: "",
  avatarURL: "",
  avatarUpdatedAt: 0,
  isPrivateAccount: false,
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  profile: defaultProfile,
});

function syncAuthCookies(currentUser: User | null) {
  if (!currentUser) {
    document.cookie = "mw-auth=; path=/; max-age=0; samesite=lax";
    document.cookie = "mw-verified=; path=/; max-age=0; samesite=lax";
    return;
  }

  const usesPassword = currentUser.providerData.some((provider) => provider.providerId === "password");
  const verified = !usesPassword || currentUser.emailVerified;
  document.cookie = "mw-auth=1; path=/; max-age=2592000; samesite=lax";
  document.cookie = `mw-verified=${verified ? "1" : "0"}; path=/; max-age=2592000; samesite=lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthProfile>(defaultProfile);

  useEffect(() => {
    if (!auth) {
      console.warn("Auth not initialized. Skipping onAuthStateChanged.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      syncAuthCookies(currentUser);

      if (currentUser?.uid && database) {
        try {
          const userRef = ref(database, `users/${currentUser.uid}`);
          await update(userRef, {
            uid: currentUser.uid,
            email: currentUser.email || "",
            updatedAt: Date.now(),
          });
        } catch (error) {
          console.error("Failed to sync user profile:", error);
        }
      } else {
        setProfile(defaultProfile);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.uid || !database) {
      setProfile(defaultProfile);
      return;
    }

    const userRef = ref(database, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      setProfile({
        displayName:
          typeof data.displayName === "string" && data.displayName
            ? data.displayName
            : user.displayName || "",
        avatarURL: typeof data.avatarURL === "string" ? data.avatarURL : "",
        avatarUpdatedAt: typeof data.avatarUpdatedAt === "number" ? data.avatarUpdatedAt : 0,
        isPrivateAccount: data.isPrivateAccount === true,
      });
    });

    return () => unsubscribe();
  }, [user?.uid, user?.displayName]);

  const value = useMemo(
    () => ({
      user,
      loading,
      profile,
    }),
    [loading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
