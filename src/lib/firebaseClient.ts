// src/lib/firebaseClient.ts
'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/**
 * Firebase Client SDK
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Validación defensiva (runtime)
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  throw new Error(
    "Missing NEXT_PUBLIC_FIREBASE_* env vars. " +
      "Firebase Client cannot be initialized."
  );
}

// Singleton client app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Exports seguros
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
