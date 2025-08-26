import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCN6YEVyHo6VM_9j82fgxlBtcCmD6EoFIs",
  authDomain: "collaborative-todo-list-c5939.firebaseapp.com",
  projectId: "collaborative-todo-list-c5939",
  storageBucket: "collaborative-todo-list-c5939.appspot.com", // <-- fixed here
  messagingSenderId: "858290662717",
  appId: "1:858290662717:web:01f4d58cf2f666780ae954",
  measurementId: "G-SF8EWVMGDY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
