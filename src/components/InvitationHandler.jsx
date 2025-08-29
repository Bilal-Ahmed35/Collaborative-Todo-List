import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";

export default function InvitationHandler({
  user,
  showSnackbar,
  setActiveListId,
}) {
  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Check for invitation parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const inviteListId = urlParams.get("invite");
    const inviteEmail = urlParams.get("email");

    if (inviteListId && inviteEmail && user) {
      handleInviteFromUrl(inviteListId, inviteEmail);
    }
  }, [user]);

  const handleInviteFromUrl = async (listId, email) => {
    if (!user) return;

    // Check if the user's email matches the invitation email
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      showSnackbar(
        `This invitation is for ${email}. Please sign in with the correct email address.`,
        "error"
      );
      // Clear URL parameters
      clearUrlParams();
      return;
    }

    setLoading(true);
    try {
      // Check if there's a pending invitation
      const pendingInvitationsRef = collection(db, "pendingInvitations");
      const q = query(
        pendingInvitationsRef,
        where("listId", "==", listId),
        where("email", "==", email.toLowerCase())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        showSnackbar("Invitation not found or has expired.", "error");
        clearUrlParams();
        return;
      }

      const invitationDoc = snapshot.docs[0];
      const invitation = invitationDoc.data();

      // Get list details
      const listRef = doc(db, "lists", listId);
      const listSnap = await getDoc(listRef);

      if (!listSnap.exists()) {
        showSnackbar("The list you were invited to no longer exists.", "error");
        // Clean up the pending invitation
        await deleteDoc(invitationDoc.ref);
        clearUrlParams();
        return;
      }

      const listData = listSnap.data();

      // Check if user is already a member
      if (listData.memberIds?.includes(user.uid)) {
        showSnackbar("You are already a member of this list.", "info");
        setActiveListId && setActiveListId(listId);
        // Clean up the pending invitation
        await deleteDoc(invitationDoc.ref);
        clearUrlParams();
        return;
      }

      // Show invitation dialog
      setInviteData({
        ...invitation,
        listName: listData.name,
        listDescription: listData.description,
        invitationDocRef: invitationDoc.ref,
        invitationId: invitationDoc.id,
      });
      setDialogOpen(true);
    } catch (error) {
      console.error("Error processing invitation:", error);
      if (error.code === "permission-denied") {
        showSnackbar(
          "Unable to access invitation. Please try signing out and back in.",
          "error"
        );
      } else {
        showSnackbar("Failed to process invitation.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearUrlParams = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const acceptInvitation = async () => {
    if (!inviteData || !user) return;

    setProcessing(true);
    try {
      // Add user to the list
      const listRef = doc(db, "lists", inviteData.listId);
      await updateDoc(listRef, {
        memberIds: arrayUnion(user.uid),
        [`roles.${user.uid}`]: inviteData.role,
      });

      // Create welcome notification
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Welcome to the team!",
        message: `You've joined "${inviteData.listName}" as ${inviteData.role}`,
        listId: inviteData.listId,
        read: false,
        createdAt: serverTimestamp(),
      });

      // Log activity
      await addDoc(collection(db, "lists", inviteData.listId, "activities"), {
        action: `joined the list as ${inviteData.role}`,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });

      // Notify the inviter
      if (inviteData.invitedBy !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: inviteData.invitedBy,
          title: "Invitation Accepted",
          message: `${user.displayName || user.email} joined "${
            inviteData.listName
          }"`,
          listId: inviteData.listId,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      // Delete the pending invitation
      await deleteDoc(inviteData.invitationDocRef);

      showSnackbar(`Welcome to "${inviteData.listName}"!`, "success");
      setActiveListId && setActiveListId(inviteData.listId);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      if (error.code === "permission-denied") {
        showSnackbar(
          "Permission denied. Please check your Firebase security rules.",
          "error"
        );
      } else {
        showSnackbar("Failed to accept invitation.", "error");
      }
    } finally {
      setProcessing(false);
    }
  };

  const declineInvitation = async () => {
    if (!inviteData) return;

    setProcessing(true);
    try {
      // Notify the inviter about the declined invitation
      if (inviteData.invitedBy !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: inviteData.invitedBy,
          title: "Invitation Declined",
          message: `${
            user.displayName || user.email
          } declined the invitation to "${inviteData.listName}"`,
          listId: inviteData.listId,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      // Delete the pending invitation
      await deleteDoc(inviteData.invitationDocRef);

      showSnackbar("Invitation declined.", "info");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error declining invitation:", error);
      showSnackbar("Failed to decline invitation.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case "viewer":
        return "View tasks and activity";
      case "editor":
        return "Create, edit, and complete tasks";
      case "owner":
        return "Full control including member management";
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return "error";
      case "editor":
        return "warning";
      case "viewer":
        return "info";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Dialog open={true}>
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Processing invitation...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={dialogOpen}
      onClose={() => !processing && setDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      {inviteData && (
        <>
          <DialogTitle>You've been invited to collaborate!</DialogTitle>
          <DialogContent>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {inviteData.listName}
                </Typography>
                {inviteData.listDescription && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {inviteData.listDescription}
                  </Typography>
                )}
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <Typography variant="body2">Your role:</Typography>
                  <Chip
                    label={inviteData.role}
                    color={getRoleColor(inviteData.role)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  As a {inviteData.role}, you'll be able to:{" "}
                  {getRoleDescription(inviteData.role)}
                </Typography>
              </CardContent>
            </Card>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>{inviteData.invitedByName}</strong> invited you to
                collaborate on this list.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={declineInvitation}
              disabled={processing}
              color="inherit"
            >
              Decline
            </Button>
            <Button
              onClick={acceptInvitation}
              variant="contained"
              disabled={processing}
            >
              {processing ? "Joining..." : "Accept & Join"}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
