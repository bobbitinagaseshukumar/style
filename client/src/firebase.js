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
  apiKey: "AIzaSyCeaApv_MzbLI0K2jWZA5e_YxW_Qs6pM6A",
  authDomain: "styleverse2-64e1c.firebaseapp.com",
  projectId: "styleverse2-64e1c",
  storageBucket: "styleverse2-64e1c.firebasestorage.app",
  messagingSenderId: "971678561546",
  appId: "1:971678561546:web:c9af7068068ebcc55476f3",
  measurementId: "G-MKDLFP71ZN"
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
