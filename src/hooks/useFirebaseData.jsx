import { useState, useEffect } from "react";
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";

export function useFirebaseData(user) {
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState({});
  const [activities, setActivities] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time listeners
  useEffect(() => {
    if (!user) {
      setLists([]);
      setTasks({});
      setActivities({});
      setNotifications([]);
      setMembers([]);
      setLoading(false);
      return;
    }

    console.log("🔍 Setting up Firebase listeners for user:", user.uid);
    console.log("🔍 User email:", user.email);
    console.log("🔍 User display name:", user.displayName);

    const unsubscribers = [];

    // Listen to lists where user is a member
    const listsQuery = query(
      collection(db, "lists"),
      where("memberIds", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );

    console.log("🔍 Starting lists query...");

    const unsubscribeLists = onSnapshot(
      listsQuery,
      (snapshot) => {
        console.log("📋 Lists snapshot received, size:", snapshot.size);
        const listsData = [];
        snapshot.forEach((doc) => {
          const listData = { id: doc.id, ...doc.data() };
          console.log("📋 List found:", {
            id: listData.id,
            name: listData.name,
            ownerId: listData.ownerId,
            memberIds: listData.memberIds,
            userIsMember: listData.memberIds?.includes(user.uid),
            userIsOwner: listData.ownerId === user.uid,
          });
          listsData.push(listData);
        });

        console.log("📋 Total lists loaded:", listsData.length);
        setLists(listsData);
        setError(null);

        // Listen to tasks for each list
        listsData.forEach((list) => {
          const tasksQuery = query(
            collection(db, "lists", list.id, "tasks"),
            orderBy("createdAt", "desc")
          );

          const unsubscribeTasks = onSnapshot(
            tasksQuery,
            (tasksSnapshot) => {
              console.log(
                `📝 Tasks for list ${list.name}:`,
                tasksSnapshot.size
              );
              const tasksData = [];
              tasksSnapshot.forEach((taskDoc) => {
                tasksData.push({ id: taskDoc.id, ...taskDoc.data() });
              });
              setTasks((prev) => ({ ...prev, [list.id]: tasksData }));
            },
            (error) => {
              console.error(
                `❌ Error loading tasks for list ${list.id}:`,
                error
              );
            }
          );

          unsubscribers.push(unsubscribeTasks);

          // Listen to activities for each list
          const activitiesQuery = query(
            collection(db, "lists", list.id, "activities"),
            orderBy("createdAt", "desc")
          );

          const unsubscribeActivities = onSnapshot(
            activitiesQuery,
            (activitiesSnapshot) => {
              console.log(
                `🔔 Activities for list ${list.name}:`,
                activitiesSnapshot.size
              );
              const activitiesData = [];
              activitiesSnapshot.forEach((activityDoc) => {
                activitiesData.push({
                  id: activityDoc.id,
                  ...activityDoc.data(),
                });
              });
              setActivities((prev) => ({ ...prev, [list.id]: activitiesData }));
            },
            (error) => {
              console.error(
                `❌ Error loading activities for list ${list.id}:`,
                error
              );
            }
          );

          unsubscribers.push(unsubscribeActivities);
        });

        setLoading(false);
      },
      (error) => {
        console.error("❌ Error loading lists:", error);
        console.error("❌ Error code:", error.code);
        console.error("❌ Error message:", error.message);
        setError(error);
        setLoading(false);
      }
    );

    unsubscribers.push(unsubscribeLists);

    // Listen to user's notifications
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        console.log("🔔 Notifications loaded:", snapshot.size);
        const notificationsData = [];
        snapshot.forEach((doc) => {
          notificationsData.push({ id: doc.id, ...doc.data() });
        });
        setNotifications(notificationsData);
      },
      (error) => {
        console.error("❌ Error loading notifications:", error);
      }
    );

    unsubscribers.push(unsubscribeNotifications);

    // Listen to all users for member info
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        console.log("👥 Users loaded:", snapshot.size);
        const usersData = [];
        snapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        setMembers(usersData);
      },
      (error) => {
        console.error("❌ Error loading users:", error);
      }
    );

    unsubscribers.push(unsubscribeUsers);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up Firebase listeners");
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  // Helper functions for CRUD operations
  const createList = async (listData) => {
    if (!user) return;

    try {
      console.log("🆕 Creating list:", listData);
      console.log("🆕 User creating list:", user.uid);

      const listPayload = {
        ...listData,
        ownerId: user.uid,
        memberIds: [user.uid],
        roles: { [user.uid]: "owner" },
        createdAt: serverTimestamp(),
      };

      console.log("🆕 List payload:", listPayload);

      const docRef = await addDoc(collection(db, "lists"), listPayload);

      console.log("✅ List created with ID:", docRef.id);

      // Log activity
      await addDoc(collection(db, "lists", docRef.id, "activities"), {
        action: `created list "${listData.name}"`,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Activity logged for new list");

      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating list:", error);
      console.error("❌ Error code:", error.code);
      console.error("❌ Error message:", error.message);
      throw error;
    }
  };

  // ... rest of your CRUD operations remain the same ...
  const createTask = async (listId, taskData) => {
    if (!user) return;

    try {
      const docRef = await addDoc(collection(db, "lists", listId, "tasks"), {
        ...taskData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      // Log activity
      await addDoc(collection(db, "lists", listId, "activities"), {
        action: `created task "${taskData.title}"`,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });

      // Create notification if task is assigned to someone else
      if (taskData.assignedToUid && taskData.assignedToUid !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: taskData.assignedToUid,
          title: "Task Assignment",
          message: `You were assigned to "${taskData.title}"`,
          listId: listId,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      return docRef.id;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  const updateTask = async (listId, taskId, taskData) => {
    if (!user) return;

    try {
      const taskRef = doc(db, "lists", listId, "tasks", taskId);
      await updateDoc(taskRef, {
        ...taskData,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await addDoc(collection(db, "lists", listId, "activities"), {
        action: `updated task "${taskData.title}"`,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });

      // Create notification for all members when task is completed
      if (taskData.done) {
        const list = lists.find((l) => l.id === listId);
        const otherMembers =
          list?.memberIds.filter((id) => id !== user.uid) || [];

        otherMembers.forEach(async (memberId) => {
          await addDoc(collection(db, "notifications"), {
            userId: memberId,
            title: "Task Completed",
            message: `${user.displayName || user.email} completed "${
              taskData.title
            }"`,
            listId: listId,
            read: false,
            createdAt: serverTimestamp(),
          });
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const deleteTask = async (listId, taskId, taskTitle) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "lists", listId, "tasks", taskId));

      // Log activity
      await addDoc(collection(db, "lists", listId, "activities"), {
        action: `deleted task "${taskTitle}"`,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const inviteMember = async (listId, email, role) => {
    if (!user) return;

    try {
      const list = lists.find((l) => l.id === listId);
      if (!list) throw new Error("List not found");

      // Check user's role - only owners and editors can invite
      const userRole = list.roles[user.uid];
      if (userRole !== "owner" && userRole !== "editor") {
        throw new Error("Insufficient permissions to invite members");
      }

      // Create pending invitation
      await addDoc(collection(db, "pendingInvitations"), {
        listId: listId,
        listName: list.name,
        email: email,
        role: role,
        invitedBy: user.uid,
        invitedByName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      });

      // Log activity
      await addDoc(collection(db, "lists", listId, "activities"), {
        action: `invited ${email} as ${role}`,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });

      // Here you would integrate with an email service like SendGrid or AWS SES
      // For now, we'll create a notification for the inviter
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Invitation Sent",
        message: `Invitation sent to ${email} for "${list.name}"`,
        listId: listId,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error inviting member:", error);
      throw error;
    }
  };

  const updateNotification = async (notificationId, updates) => {
    if (!user) return;

    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating notification:", error);
      throw error;
    }
  };

  // Check user permissions for a list
  const getUserRole = (listId) => {
    const list = lists.find((l) => l.id === listId);
    return list?.roles?.[user?.uid] || null;
  };

  const canUserEdit = (listId) => {
    const role = getUserRole(listId);
    return role === "owner" || role === "editor";
  };

  const canUserView = (listId) => {
    const list = lists.find((l) => l.id === listId);
    return list?.memberIds?.includes(user?.uid) || false;
  };

  return {
    lists,
    tasks,
    activities,
    notifications,
    members,
    loading,
    error, // Add error state
    // CRUD operations
    createList,
    createTask,
    updateTask,
    deleteTask,
    inviteMember,
    updateNotification,
    // Permission helpers
    getUserRole,
    canUserEdit,
    canUserView,
  };
}
