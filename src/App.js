import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./Firebase/firebase";

import SignIn from "./Pages/SignIn";
import Dashboard from "./Pages/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });

    return () => unsubscribe();
  }, []);

  if (!ready) return <div>Loading...</div>;
  if (!user) return <SignIn />;

  return <Dashboard user={user} onSignOut={() => signOut(auth)} />;
}
