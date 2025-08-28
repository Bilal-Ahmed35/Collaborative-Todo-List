import React, { useEffect, useState } from "react";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./Firebase/firebase";
import {
  doc,
  onSnapshot,
  query,
  collection,
  where,
  getDocs,
  setDoc,
  arrayUnion,
  serverTimestamp,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import SignIn from "./Pages/SignIn";
import Dashboard from "./Pages/Dashboard";
import UserProfile from "./Components/UserProfile";

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Create theme based on dark mode preference
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#1976d2",
      },
      secondary: {
        main: "#dc004e",
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: darkMode
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 20px rgba(0,0,0,0.1)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  });

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme !== null) {
      setDarkMode(JSON.parse(savedTheme));
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", JSON.stringify(newDarkMode));
  };

  // Check for pending invitations when user signs in
  const checkPendingInvitations = async (user) => {
    try {
      const pendingQuery = query(
        collection(db, "pendingInvitations"),
        where("email", "==", user.email)
      );
      const pendingSnap = await getDocs(pendingQuery);

      for (const inviteDoc of pendingSnap.docs) {
        const invite = inviteDoc.data();

        // Add user to the list
        await setDoc(
          doc(db, "lists", invite.listId),
          {
            memberIds: arrayUnion(user.uid),
            roles: { [user.uid]: invite.role },
          },
          { merge: true }
        );

        // Create notification for successful invitation
        await addDoc(collection(db, "notifications"), {
          userId: user.uid,
          title: "Welcome to List!",
          message: `You've been added to "${invite.listName}" by ${invite.invitedByName}`,
          listId: invite.listId,
          read: false,
          createdAt: serverTimestamp(),
        });

        // Delete the pending invitation
        await deleteDoc(doc(db, "pendingInvitations", inviteDoc.id));
      }
    } catch (error) {
      console.error("Error checking pending invitations:", error);
    }
  };

  // Authentication state listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        // Check for pending invitations
        await checkPendingInvitations(u);

        // Listen to user profile changes
        const userProfileUnsub = onSnapshot(doc(db, "users", u.uid), (doc) => {
          if (doc.exists()) {
            setUserProfile({ id: doc.id, ...doc.data() });
          }
        });

        setReady(true);
        return () => userProfileUnsub();
      } else {
        setUserProfile(null);
        setReady(true);
      }
    });

    return () => unsubAuth();
  }, []);

  // Loading screen
  if (!ready) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            gap: 2,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading Collab Todo...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // Sign in screen
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SignIn />
      </ThemeProvider>
    );
  }

  // Main app
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dashboard
        user={user}
        userProfile={userProfile}
        onSignOut={() => signOut(auth)}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onOpenProfile={() => setProfileOpen(true)}
      />
      <UserProfile
        user={user}
        userProfile={userProfile}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </ThemeProvider>
  );
}
