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
        `Domain "${currentDomain}" is not authorized for Google sign-in.`
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
