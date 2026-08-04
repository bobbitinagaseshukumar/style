import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Firebase configuration from environment variables with safe fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoApiKeyStyleVerse2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "styleverse-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "styleverse-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "styleverse-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Trigger Google Sign-In popup via Firebase Auth
 * Returns the user's credential object, user info, and ID token
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
      },
      idToken
    };
  } catch (error) {
    console.error('Firebase Google Auth Error:', error);
    return {
      success: false,
      error: error.message || 'Google sign-in failed'
    };
  }
};

export const logoutFirebase = () => signOut(auth);

export default app;
