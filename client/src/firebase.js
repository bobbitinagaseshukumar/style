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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDxSYJ0C1PUxWLvagPoQVOHjo0-Ft7QOLw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "styleverse-c3847.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "styleverse-c3847",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "styleverse-c3847.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "166711176761",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:166711176761:web:b387da73aec5c70fcee7e8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KKQPYGR316"
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

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithApple = () => signInWithPopup(auth, appleProvider);
export const signInWithFacebook = () => signInWithPopup(auth, facebookProvider);
export const signInWithGithub = () => signInWithPopup(auth, githubProvider);

export const logoutFirebase = () => signOut(auth);

export default app;
