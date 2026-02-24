import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const getFirebaseConfig = () => {
  const rawApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const apiKey = rawApiKey?.trim().replace(/^['"]|['"]$/g, "");
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  let missingKeys = "";
  if (!apiKey) missingKeys += "NEXT_PUBLIC_FIREBASE_API_KEY, ";
  if (!authDomain) missingKeys += "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, ";
  if (!databaseURL) missingKeys += "NEXT_PUBLIC_FIREBASE_DATABASE_URL, ";
  if (!projectId) missingKeys += "NEXT_PUBLIC_FIREBASE_PROJECT_ID, ";
  if (!storageBucket) missingKeys += "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, ";
  if (!messagingSenderId) missingKeys += "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, ";
  if (!appId) missingKeys += "NEXT_PUBLIC_FIREBASE_APP_ID, ";

  if (missingKeys) {
    console.error(`Missing env var(s): ${missingKeys.slice(0, -2)}`);
  }

  if (process.env.NODE_ENV === "development") {
    const maskedApiKey = apiKey
      ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`
      : "MISSING";
    const debugParts = [
      `projectId=${projectId ?? "MISSING"}`,
      `authDomain=${authDomain ?? "MISSING"}`,
      `databaseURL=${databaseURL ?? "MISSING"}`,
      `apiKey=${maskedApiKey}`,
    ];
    console.debug(`[firebase] env ${debugParts.join(" ")}`);
  }

  return {
    apiKey,
    authDomain,
    databaseURL,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
};

const app = initializeApp(getFirebaseConfig());

export const db = getDatabase(app);
export const auth = getAuth(app);
