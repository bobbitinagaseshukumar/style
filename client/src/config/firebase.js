// Firebase Analytics initialization for the StyleVerse client.
//
// NOTE: The app already has a default Firebase app in `src/firebase.js`
// (project "styleverse-c3847") used for social authentication. To avoid the
// "Firebase App named '[DEFAULT]' already exists" duplicate-app crash, this
// analytics config is initialized as a SEPARATE NAMED app ("analytics").
//
// Config values are read from Vite env vars (VITE_FIREBASE_*) with the
// project defaults as fallback so the app works out of the box.
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

const ANALYTICS_APP_NAME = 'analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCeaApv_MzbLI0K2jWZA5e_YxW_Qs6pM6A',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'styleverse2-64e1c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'styleverse2-64e1c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'styleverse2-64e1c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '971678561546',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:971678561546:web:c9af7068068ebcc55476f3',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-MKDLFP71ZN',
};

// Reuse the named app if it already exists (prevents re-init on HMR / double import).
const existing = getApps().find((a) => a.name === ANALYTICS_APP_NAME);
const app = existing || initializeApp(firebaseConfig, ANALYTICS_APP_NAME);

// Analytics only runs in supported browser environments (not SSR, not all
// browsers). isSupported() prevents runtime crashes where it isn't available.
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics unavailable — safe to ignore.
    });
}

export { app, analytics, firebaseConfig };
export default app;
