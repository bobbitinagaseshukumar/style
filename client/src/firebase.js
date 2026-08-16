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
  apiKey: "AIzaSyDxSYJ0C1PUxWLvagPoQVOHjo0-Ft7QOLw",
  authDomain: "styleverse-c3847.firebaseapp.com",
  projectId: "styleverse-c3847",
  storageBucket: "styleverse-c3847.firebasestorage.app",
  messagingSenderId: "166711176761",
  appId: "1:166711176761:web:b387da73aec5c70fcee7e8",
  measurementId: "G-KKQPYGR316"
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
