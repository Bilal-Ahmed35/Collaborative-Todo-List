import { useState, useEffect, useCallback } from "react";
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
  getDoc,
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

  // Helper function to handle errors consistently
  const handleError = useCallback((error, context) => {
    console.error(`❌ Error in ${context}:`, error);
    console.error(`❌ Error code: ${error.code}`);
    console.error(`❌ Error message: ${error.message}`);

    // Set a user-friendly error message
    let userMessage = "An unexpected error occurred";
    if (error.code === "permission-denied") {
      userMessage = "You don't have permission to access this data";
    } else if (error.code === "unavailable") {
      userMessage = "Service temporarily unavailable. Please try again";
    } else if (error.code === "not-found") {
      userMessage = "The requested data was not found";
    }

    setError({
      code: error.code,
      message: error.message,
      userMessage,
      context,
    });
  }, []);

  // Real-time listeners with improved error handling
  useEffect(() => {
    if (!user) {
      setLists([]);
      setTasks({});
      setActivities({});
      setNotifications([]);
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    console.log("🔍 Setting up Firebase listeners for user:", user.uid);

    const unsubscribers = [];
    let listsLoaded = false;

    // Listen to lists where user is a member
    const listsQuery = query(
      collection(db, "lists"),
      where("memberIds", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );

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
            memberCount: listData.memberIds?.length || 0,
          });
          listsData.push(listData);
        });

        console.log("📋 Total lists loaded:", listsData.length);
        setLists(listsData);
        setError(null);
        listsLoaded = true;

        // Set up task and activity listeners for each list
        listsData.forEach((list) => {
          // Tasks listener
          const tasksQuery = query(
            collection(db, "lists", list.id, "tasks"),
            orderBy("createdAt", "desc")
          );

          const unsubscribeTasks = onSnapshot(
            tasksQuery,
            (tasksSnapshot) => {
              const tasksData = [];
              tasksSnapshot.forEach((taskDoc) => {
                const taskData = { id: taskDoc.id, ...taskDoc.data() };
                // Convert Firestore timestamps to Date objects
                if (taskData.createdAt?.toDate) {
                  taskData.createdAt = taskData.createdAt.toDate();
                }
                if (taskData.updatedAt?.toDate) {
                  taskData.updatedAt = taskData.updatedAt.toDate();
                }
                tasksData.push(taskData);
              });

              console.log(
                `📝 Tasks for list ${list.name}: ${tasksData.length}`
              );
              setTasks((prev) => ({ ...prev, [list.id]: tasksData }));
            },
            (error) => handleError(error, `loading tasks for list ${list.id}`)
          );

          unsubscribers.push(unsubscribeTasks);

          // Activities listener
          const activitiesQuery = query(
            collection(db, "lists", list.id, "activities"),
            orderBy("createdAt", "desc")
          );

          const unsubscribeActivities = onSnapshot(
            activitiesQuery,
            (activitiesSnapshot) => {
              const activitiesData = [];
              activitiesSnapshot.forEach((activityDoc) => {
                const activityData = {
                  id: activityDoc.id,
                  ...activityDoc.data(),
                };
                // Convert Firestore timestamps
                if (activityData.createdAt?.toDate) {
                  activityData.createdAt = activityData.createdAt.toDate();
                }
                activitiesData.push(activityData);
              });

              console.log(
                `🔔 Activities for list ${list.name}: ${activitiesData.length}`
              );
              setActivities((prev) => ({ ...prev, [list.id]: activitiesData }));
            },
            (error) =>
              handleError(error, `loading activities for list ${list.id}`)
          );

          unsubscribers.push(unsubscribeActivities);
        });

        if (listsLoaded) {
          setLoading(false);
        }
      },
      (error) => {
        handleError(error, "loading lists");
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
        const notificationsData = [];
        snapshot.forEach((doc) => {
          const notificationData = { id: doc.id, ...doc.data() };
          // Convert timestamps
          if (notificationData.createdAt?.toDate) {
            notificationData.createdAt = notificationData.createdAt.toDate();
          }
          notificationsData.push(notificationData);
        });
        console.log("🔔 Notifications loaded:", notificationsData.length);
        setNotifications(notificationsData);
      },
      (error) => handleError(error, "loading notifications")
    );

    unsubscribers.push(unsubscribeNotifications);

    // Listen to all users for member info
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = [];
        snapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() };
          // Convert timestamps
          if (userData.createdAt?.toDate) {
            userData.createdAt = userData.createdAt.toDate();
          }
          if (userData.lastLoginAt?.toDate) {
            userData.lastLoginAt = userData.lastLoginAt.toDate();
          }
          usersData.push(userData);
        });
        console.log("👥 Users loaded:", usersData.length);
        setMembers(usersData);
      },
      (error) => handleError(error, "loading users")
    );

    unsubscribers.push(unsubscribeUsers);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up Firebase listeners");
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [user, handleError]);

  // Helper functions for CRUD operations with improved error handling
  const createList = async (listData) => {
    if (!user) throw new Error("User not authenticated");

    try {
      console.log("🆕 Creating list:", listData);

      const listPayload = {
        ...listData,
        ownerId: user.uid,
        memberIds: [user.uid],
        roles: { [user.uid]: "owner" },
        createdAt: serverTimestamp(),
      };

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

      return docRef.id;
    } catch (error) {
      handleError(error, "creating list");
      throw error;
    }
  };

  const createTask = async (listId, taskData) => {
    if (!user) throw new Error("User not authenticated");

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
      handleError(error, "creating task");
      throw error;
    }
  };

  const updateTask = async (listId, taskId, taskData) => {
    if (!user) throw new Error("User not authenticated");

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

      // Create notification for completion
      if (
        taskData.done &&
        taskData.assignedToUid &&
        taskData.assignedToUid !== user.uid
      ) {
        await addDoc(collection(db, "notifications"), {
          userId: taskData.assignedToUid,
          title: "Task Completed",
          message: `Task "${taskData.title}" was marked as complete`,
          listId: listId,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleError(error, "updating task");
      throw error;
    }
  };

  const deleteTask = async (listId, taskId, taskTitle) => {
    if (!user) throw new Error("User not authenticated");

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
      handleError(error, "deleting task");
      throw error;
    }
  };

  const inviteMember = async (listId, email, role) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const list = lists.find((l) => l.id === listId);
      if (!list) throw new Error("List not found");

      // Check user's permissions
      const userRole = list.roles[user.uid];
      if (userRole !== "owner" && userRole !== "editor") {
        throw new Error("Insufficient permissions to invite members");
      }

      // Only owners can invite other owners
      if (role === "owner" && userRole !== "owner") {
        throw new Error("Only owners can invite other owners");
      }

      // Check if email is already a member
      if (list.memberIds?.includes(email)) {
        throw new Error("User is already a member of this list");
      }

      // Create pending invitation
      await addDoc(collection(db, "pendingInvitations"), {
        listId: listId,
        listName: list.name,
        email: email.toLowerCase(),
        role: role,
        invitedBy: user.uid,
        invitedByName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // Log activity
      await addDoc(collection(db, "lists", listId, "activities"), {
        action: `invited ${email} as ${role}`,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleError(error, "inviting member");
      throw error;
    }
  };

  const updateNotification = async (notificationId, updates) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleError(error, "updating notification");
      throw error;
    }
  };

  // Permission helper functions
  const getUserRole = useCallback(
    (listId) => {
      const list = lists.find((l) => l.id === listId);
      return list?.roles?.[user?.uid] || null;
    },
    [lists, user]
  );

  const canUserEdit = useCallback(
    (listId) => {
      const role = getUserRole(listId);
      return role === "owner" || role === "editor";
    },
    [getUserRole]
  );

  const canUserView = useCallback(
    (listId) => {
      const list = lists.find((l) => l.id === listId);
      return list?.memberIds?.includes(user?.uid) || false;
    },
    [lists, user]
  );

  return {
    lists,
    tasks,
    activities,
    notifications,
    members,
    loading,
    error,
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
