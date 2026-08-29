import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCeaApv_MzbLI0K2jWZA5e_YxW_Qs6pM6A",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "styleverse2-64e1c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "styleverse2-64e1c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "styleverse2-64e1c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "971678561546",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:971678561546:web:c9af7068068ebcc55476f3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MKDLFP71ZN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Apple Auth Provider
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Facebook & GitHub Providers
export const facebookProvider = new FacebookAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Wrap signInWithPopup to catch unauthorized-domain errors gracefully
const safeSignIn = (provider) => async () => {
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    if (error?.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      console.error(
        `[Firebase Auth] Domain "${currentDomain}" is not authorized.\n` +
        `Add it at: https://console.firebase.google.com/project/styleverse2-64e1c/authentication/settings`
      );
      const customErr = new Error(
        `Domain "${currentDomain}" is not authorized for Google sign-in. Please add "${currentDomain}" in Firebase Console Authorized Domains.`
      );
      customErr.code = 'auth/unauthorized-domain';
      throw customErr;
    }
    throw error;
  }
};

export const signInWithGoogle = safeSignIn(googleProvider);
export const signInWithApple = safeSignIn(appleProvider);
export const signInWithFacebook = safeSignIn(facebookProvider);
export const signInWithGithub = safeSignIn(githubProvider);

export const logoutFirebase = () => signOut(auth);

export default app;
