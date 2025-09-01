import React, { useEffect, useState, useCallback } from "react";
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
  const [mounted, setMounted] = useState(true);

  // Safe state update helper
  const safeSetState = useCallback(
    (setter) => {
      if (mounted) {
        setter();
      }
    },
    [mounted]
  );

  // Clear URL parameters helper
  const clearUrlParams = useCallback(() => {
    try {
      const url = new URL(window.location);
      url.searchParams.delete("invite");
      url.searchParams.delete("email");
      window.history.replaceState({}, document.title, url.toString());
    } catch (error) {
      console.error("Error clearing URL params:", error);
    }
  }, []);

  // Enhanced error handling
  const handleError = useCallback(
    (error, context) => {
      console.error(`Error in ${context}:`, error);

      let message = "An unexpected error occurred. Please try again.";

      switch (error.code) {
        case "permission-denied":
          message =
            "Access denied. Please sign in with the correct email address.";
          break;
        case "not-found":
          message = "Invitation not found or has expired.";
          break;
        case "unavailable":
          message = "Service temporarily unavailable. Please try again later.";
          break;
        case "cancelled":
          message = "Operation was cancelled. Please try again.";
          break;
        default:
          if (error.message) {
            message = error.message;
          }
      }

      showSnackbar(message, "error");
    },
    [showSnackbar]
  );

  useEffect(() => {
    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    // Check for invitation parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const inviteListId = urlParams.get("invite");
    const inviteEmail = urlParams.get("email");

    if (inviteListId && inviteEmail && user && mounted) {
      handleInviteFromUrl(inviteListId, inviteEmail);
    }
  }, [user, mounted]);

  const handleInviteFromUrl = async (listId, email) => {
    if (!user || !mounted) return;

    // Validate inputs
    if (!listId || !email) {
      showSnackbar("Invalid invitation link.", "error");
      clearUrlParams();
      return;
    }

    // Check if the user's email matches the invitation email
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      showSnackbar(
        `This invitation is for ${email}. Please sign in with the correct email address.`,
        "error"
      );
      clearUrlParams();
      return;
    }

    safeSetState(() => setLoading(true));

    try {
      // Check if there's a pending invitation
      const pendingInvitationsRef = collection(db, "pendingInvitations");
      const q = query(
        pendingInvitationsRef,
        where("listId", "==", listId),
        where("email", "==", email.toLowerCase())
      );
      const snapshot = await getDocs(q);

      if (!mounted) return;

      if (snapshot.empty) {
        showSnackbar(
          "Invitation not found or has expired. The list owner may need to send a new invitation.",
          "error"
        );
        clearUrlParams();
        return;
      }

      const invitationDoc = snapshot.docs[0];
      const invitation = invitationDoc.data();

      // Check if invitation has expired
      const expiresAt =
        invitation.expiresAt?.toDate?.() || invitation.expiresAt;
      if (expiresAt && new Date(expiresAt) < new Date()) {
        showSnackbar(
          "This invitation has expired. Please ask for a new invitation.",
          "error"
        );
        // Clean up expired invitation
        try {
          await deleteDoc(invitationDoc.ref);
        } catch (cleanupError) {
          console.error("Error cleaning up expired invitation:", cleanupError);
        }
        clearUrlParams();
        return;
      }

      // Get list details
      const listRef = doc(db, "lists", listId);
      const listSnap = await getDoc(listRef);

      if (!mounted) return;

      if (!listSnap.exists()) {
        showSnackbar("The list you were invited to no longer exists.", "error");
        // Clean up the pending invitation
        try {
          await deleteDoc(invitationDoc.ref);
        } catch (cleanupError) {
          console.error(
            "Error cleaning up invitation for deleted list:",
            cleanupError
          );
        }
        clearUrlParams();
        return;
      }

      const listData = listSnap.data();

      // Check if user is already a member
      if (listData.memberIds?.includes(user.uid)) {
        showSnackbar("You are already a member of this list.", "info");
        if (setActiveListId) {
          setActiveListId(listId);
        }
        // Clean up the pending invitation
        try {
          await deleteDoc(invitationDoc.ref);
        } catch (cleanupError) {
          console.error(
            "Error cleaning up invitation for existing member:",
            cleanupError
          );
        }
        clearUrlParams();
        return;
      }

      // Show invitation dialog
      if (mounted) {
        safeSetState(() =>
          setInviteData({
            ...invitation,
            listName: listData.name,
            listDescription: listData.description,
            invitationDocRef: invitationDoc.ref,
            invitationId: invitationDoc.id,
          })
        );
        safeSetState(() => setDialogOpen(true));
      }
    } catch (error) {
      if (!mounted) return;
      handleError(error, "processing invitation");
      clearUrlParams();
    } finally {
      if (mounted) {
        safeSetState(() => setLoading(false));
      }
    }
  };

  const acceptInvitation = async () => {
    if (!inviteData || !user || !mounted) return;

    safeSetState(() => setProcessing(true));

    try {
      console.log("Accepting invitation for list:", inviteData.listId);

      // Add user to the list with proper error handling
      const listRef = doc(db, "lists", inviteData.listId);

      // First, get the current list to make sure it still exists
      const listSnap = await getDoc(listRef);
      if (!listSnap.exists()) {
        throw new Error("The list no longer exists");
      }

      const currentListData = listSnap.data();

      // Check if user is already a member (double-check)
      if (currentListData.memberIds?.includes(user.uid)) {
        throw new Error("You are already a member of this list");
      }

      // Validate role before adding
      const validRoles = ["viewer", "editor", "owner"];
      if (!validRoles.includes(inviteData.role)) {
        throw new Error("Invalid role specified in invitation");
      }

      // Update the list with new member
      await updateDoc(listRef, {
        memberIds: arrayUnion(user.uid),
        [`roles.${user.uid}`]: inviteData.role,
        updatedAt: serverTimestamp(),
      });

      console.log("User added to list successfully");

      // Create welcome notification
      const notifications = [
        addDoc(collection(db, "notifications"), {
          userId: user.uid,
          title: "Welcome to the team!",
          message: `You've joined "${inviteData.listName}" as ${inviteData.role}`,
          listId: inviteData.listId,
          type: "welcome",
          read: false,
          createdAt: serverTimestamp(),
        }),
      ];

      // Log activity
      const activityPromise = addDoc(
        collection(db, "lists", inviteData.listId, "activities"),
        {
          action: `joined the list as ${inviteData.role}`,
          userId: user.uid,
          userName: user.displayName || user.email,
          userPhoto: user.photoURL || null,
          createdAt: serverTimestamp(),
        }
      );

      // Notify the inviter
      if (inviteData.invitedBy && inviteData.invitedBy !== user.uid) {
        notifications.push(
          addDoc(collection(db, "notifications"), {
            userId: inviteData.invitedBy,
            title: "Invitation Accepted",
            message: `${user.displayName || user.email} joined "${
              inviteData.listName
            }"`,
            listId: inviteData.listId,
            type: "invitation_accepted",
            read: false,
            createdAt: serverTimestamp(),
          })
        );
      }

      // Execute all promises concurrently for better performance
      await Promise.all([...notifications, activityPromise]);

      // Delete the pending invitation
      await deleteDoc(inviteData.invitationDocRef);

      if (!mounted) return;

      showSnackbar(
        `Welcome to "${inviteData.listName}"! You now have ${inviteData.role} access.`,
        "success"
      );

      // Set the newly joined list as active
      if (setActiveListId) {
        setTimeout(() => {
          if (mounted) {
            setActiveListId(inviteData.listId);
          }
        }, 1000);
      }

      safeSetState(() => setDialogOpen(false));
      clearUrlParams();
    } catch (error) {
      if (!mounted) return;
      console.error("Error accepting invitation:", error);
      handleError(error, "accepting invitation");
    } finally {
      if (mounted) {
        safeSetState(() => setProcessing(false));
      }
    }
  };

  const declineInvitation = async () => {
    if (!inviteData || !mounted) return;

    safeSetState(() => setProcessing(true));

    try {
      const promises = [];

      // Notify the inviter about the declined invitation
      if (inviteData.invitedBy && inviteData.invitedBy !== user?.uid) {
        promises.push(
          addDoc(collection(db, "notifications"), {
            userId: inviteData.invitedBy,
            title: "Invitation Declined",
            message: `${
              user?.displayName || user?.email || "Someone"
            } declined the invitation to "${inviteData.listName}"`,
            listId: inviteData.listId,
            type: "invitation_declined",
            read: false,
            createdAt: serverTimestamp(),
          })
        );
      }

      // Delete the pending invitation
      promises.push(deleteDoc(inviteData.invitationDocRef));

      await Promise.all(promises);

      if (!mounted) return;

      showSnackbar("Invitation declined.", "info");
      safeSetState(() => setDialogOpen(false));
      clearUrlParams();
    } catch (error) {
      if (!mounted) return;
      console.error("Error declining invitation:", error);
      showSnackbar("Failed to decline invitation.", "error");
    } finally {
      if (mounted) {
        safeSetState(() => setProcessing(false));
      }
    }
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      viewer: "View tasks, comments, and activity",
      editor: "Create, edit, and complete tasks",
      owner: "Full control including member management and list deletion",
    };
    return descriptions[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      owner: "error",
      editor: "warning",
      viewer: "info",
    };
    return colors[role] || "default";
  };

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    if (!processing && mounted) {
      setDialogOpen(false);
      clearUrlParams();
    }
  }, [processing, mounted, clearUrlParams]);

  if (loading) {
    return (
      <Dialog open={true} maxWidth="sm" fullWidth disableEscapeKeyDown>
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress size={48} />
          <Typography sx={{ mt: 2 }} variant="h6">
            Processing invitation...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we verify your invitation
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={dialogOpen}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={processing}
    >
      {inviteData && (
        <>
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              🎉 You've been invited!
            </Box>
          </DialogTitle>
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
                collaborate on this list. By accepting, you'll gain{" "}
                <strong>{inviteData.role}</strong> access and can start
                collaborating immediately.
              </Typography>
            </Alert>

            {processing && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Processing your request... Please don't close this window.
                </Typography>
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={declineInvitation}
              disabled={processing}
              color="inherit"
            >
              {processing ? "Processing..." : "Decline"}
            </Button>
            <Button
              onClick={acceptInvitation}
              variant="contained"
              disabled={processing}
            >
              {processing ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} />
                  Joining...
                </Box>
              ) : (
                "Accept & Join"
              )}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
