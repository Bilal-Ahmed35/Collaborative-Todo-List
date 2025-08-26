import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./Firebase/firebase";
import SignIn from "//pages/SignIn";
import Dashboard from "//pages/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  if (!ready) return <div>Loading…</div>;
  if (!user) return <SignIn />;

  return (
    <>
      <header
        style={{ display: "flex", gap: 12, alignItems: "center", padding: 12 }}
      >
        <strong>Collab Todo</strong>
        <span style={{ marginLeft: "auto" }}>{user.displayName}</span>
        <button onClick={() => signOut(auth)}>Sign out</button>
      </header>
      <Dashboard user={user} />
    </>
  );
}
