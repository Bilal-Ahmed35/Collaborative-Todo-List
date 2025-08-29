import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Google as GoogleIcon } from "@mui/icons-material";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../Firebase/firebase";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Create/update user document in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // New user - create profile
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
      } else {
        // Existing user - update last login
        await setDoc(
          userDocRef,
          {
            lastLoginAt: new Date(),
          },
          { merge: true }
        );
      }

      // Check for pending invitations for this email
      await checkPendingInvitations(user);
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkPendingInvitations = async (user) => {
    try {
      const {
        collection,
        query,
        where,
        getDocs,
        deleteDoc,
        updateDoc,
        doc: firestoreDoc,
        arrayUnion,
      } = await import("firebase/firestore");

      // Query pending invitations for this email
      const invitationsRef = collection(db, "pendingInvitations");
      const q = query(invitationsRef, where("email", "==", user.email));
      const snapshot = await getDocs(q);

      // Process each invitation
      for (const invitationDoc of snapshot.docs) {
        const invitation = invitationDoc.data();

        // Add user to the list
        const listRef = firestoreDoc(db, "lists", invitation.listId);
        await updateDoc(listRef, {
          memberIds: arrayUnion(user.uid),
          [`roles.${user.uid}`]: invitation.role,
        });

        // Create notification for user
        const notificationRef = firestoreDoc(
          db,
          "notifications",
          `${user.uid}_${Date.now()}`
        );
        await setDoc(notificationRef, {
          userId: user.uid,
          title: "List Invitation Accepted",
          message: `You've been added to "${invitation.listName}" as ${invitation.role}`,
          listId: invitation.listId,
          read: false,
          createdAt: new Date(),
        });

        // Delete the pending invitation
        await deleteDoc(invitationDoc.ref);
      }
    } catch (error) {
      console.error("Error processing invitations:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", mx: 2 }}>
        <CardContent sx={{ textAlign: "center", p: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
            color="primary"
            fontWeight="bold"
          >
            Collab Todo
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Collaborate on tasks with your team in real-time
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={
              loading ? <CircularProgress size={20} /> : <GoogleIcon />
            }
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{ mt: 2, py: 1.5 }}
          >
            {loading ? "Signing in..." : "Continue with Google"}
          </Button>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: "block" }}
          >
            By signing in, you agree to our terms and privacy policy
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
