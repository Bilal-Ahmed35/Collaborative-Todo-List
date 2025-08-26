import { useEffect, useState } from "react";
import { db } from "../Firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  getDocs,
  setDoc,
  arrayUnion,
} from "firebase/firestore";

export default function ListView({ listId, user }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "lists", listId, "tasks"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [listId]);

  async function addTask() {
    if (!title.trim()) return;
    await addDoc(collection(db, "lists", listId, "tasks"), {
      title,
      done: false,
      assignedToUid: null,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    setTitle("");
  }

  async function toggleDone(t) {
    await updateDoc(doc(db, "lists", listId, "tasks", t.id), { done: !t.done });
  }

  // ---- Invite by email (find the user's uid from users collection) ----
  async function inviteByEmail() {
    const q = query(collection(db, "users"), where("email", "==", inviteEmail));
    const snap = await getDocs(q);
    if (snap.empty) {
      alert("No user with that email.");
      return;
    }
    const targetUid = snap.docs[0].data().uid;
    // add to members & roles
    await setDoc(
      doc(db, "lists", listId),
      {
        memberIds: arrayUnion(targetUid),
        roles: { [targetUid]: "editor" },
      },
      { merge: true }
    );
    setInviteEmail("");
    alert("Invited!");
  }

  return (
    <div>
      <h2>Tasks</h2>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task"
        />
        <button onClick={addTask}>Add</button>
      </div>

      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <label>
              <input
                type="checkbox"
                checked={!!t.done}
                onChange={() => toggleDone(t)}
              />{" "}
              {t.title}
            </label>
          </li>
        ))}
      </ul>

      <hr />
      <h3>Share list</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="friend@example.com"
        />
        <button onClick={inviteByEmail}>Invite</button>
      </div>
    </div>
  );
}
