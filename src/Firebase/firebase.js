import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Validate required config
const requiredKeys = [
  "REACT_APP_FIREBASE_API_KEY",
  "REACT_APP_FIREBASE_AUTH_DOMAIN",
  "REACT_APP_FIREBASE_PROJECT_ID",
  "REACT_APP_FIREBASE_STORAGE_BUCKET",
  "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  "REACT_APP_FIREBASE_APP_ID",
];

const missingKeys = requiredKeys.filter((key) => !process.env[key]);
if (missingKeys.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingKeys.join(", ")}`
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Development emulator setup (optional)
if (
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_USE_EMULATOR === "true"
) {
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("🔧 Connected to Firestore emulator");
  } catch (error) {
    console.log("⚠️ Firestore emulator connection failed:", error.message);
  }
}
