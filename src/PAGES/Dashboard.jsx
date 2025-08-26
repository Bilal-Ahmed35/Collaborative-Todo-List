import { useEffect, useState } from "react";
import { db } from "../Firebase/firebase";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import ListView from "./ListView";

export default function Dashboard({ user }) {
  const [lists, setLists] = useState([]);
  const [active, setActive] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "lists"),
      where("memberIds", "array-contains", user.uid)
    );
    return onSnapshot(q, (snap) => {
      setLists(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      if (!active && snap.docs[0]) setActive(snap.docs[0].id);
    });
  }, [user.uid]);

  async function createList() {
    if (!name.trim()) return;
    const ref = await addDoc(collection(db, "lists"), {
      name,
      ownerId: user.uid,
      memberIds: [user.uid],
      roles: { [user.uid]: "owner" },
      createdAt: serverTimestamp(),
    });
    setName("");
    setActive(ref.id);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: 16,
        padding: 16,
      }}
    >
      <aside>
        <h3>Your Lists</h3>
        <ul>
          {lists.map((l) => (
            <li key={l.id}>
              <button onClick={() => setActive(l.id)}>{l.name}</button>
            </li>
          ))}
        </ul>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New list name"
        />
        <button onClick={createList}>Create list</button>
      </aside>

      <main>
        {active ? (
          <ListView listId={active} user={user} />
        ) : (
          <p>Select a list</p>
        )}
      </main>
    </div>
  );
}
