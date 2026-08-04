import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

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

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

export const signInWithGoogle = () => signInWithPopup(auth, provider);

export const logoutFirebase = () => signOut(auth);

export default app;
