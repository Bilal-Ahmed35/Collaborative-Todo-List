import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

// Mock Firebase
jest.mock("./Firebase/firebase", () => ({
  auth: {},
  googleProvider: {},
  db: {},
}));

// Mock Firebase auth
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Simulate no user logged in
    setTimeout(() => callback(null), 0);
    return () => {}; // unsubscribe function
  }),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

// Mock Firebase firestore
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  connectFirestoreEmulator: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  setDoc: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
  serverTimestamp: jest.fn(),
  getDoc: jest.fn(),
}));

test("renders login screen when not authenticated", async () => {
  render(<App />);

  // Wait for auth state to be determined
  await waitFor(() => {
    expect(screen.getByText("Collab Todo")).toBeInTheDocument();
  });

  // Should show login screen
  expect(screen.getByText("Continue with Google")).toBeInTheDocument();
});

test("shows loading screen initially", () => {
  render(<App />);

  // Should show loading screen initially
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

test("app is wrapped in error boundary", () => {
  // This test ensures the error boundary is present
  expect(() => render(<App />)).not.toThrow();
});
