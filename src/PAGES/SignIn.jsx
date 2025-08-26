import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignIn() {
  async function signIn() {
    const { user } = await signInWithPopup(auth, googleProvider);
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
      <button onClick={signIn}>Continue with Google</button>
    </div>
  );
}
