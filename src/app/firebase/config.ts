import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCzhCv-cUMo0romjmDi-ARjpWH9h_FNvv0",
  authDomain: "my-writing-app-2cdc8.firebaseapp.com",
  databaseURL: "https://my-writing-app-2cdc8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "my-writing-app-2cdc8",
  storageBucket: "my-writing-app-2cdc8.firebasestorage.app",
  messagingSenderId: "626824537313",
  appId: "1:626824537313:web:97c1541b333828d575c3a0",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);

