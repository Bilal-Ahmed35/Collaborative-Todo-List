import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCN6YEVyHo6VM_9j82fgxlBtcCmD6EoFIs",
  authDomain: "collaborative-todo-list-c5939.firebaseapp.com",
  projectId: "collaborative-todo-list-c5939",
  storageBucket: "collaborative-todo-list-c5939.firebasestorage.app",
  messagingSenderId: "858290662717",
  appId: "1:858290662717:web:01f4d58cf2f666780ae954",
  measurementId: "G-SF8EWVMGDY",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
