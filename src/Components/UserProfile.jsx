import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  Box,
  Typography,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { PhotoCamera, Edit } from "@mui/icons-material";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../Firebase/firebase";

export default function UserProfile({ user, userProfile, open, onClose }) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      showSnackbar("Display name is required", "error");
      return;
    }

    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
      });

      // Update Firestore user document
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        updatedAt: new Date(),
      });

      showSnackbar("Profile updated successfully!", "success");

      // Close dialog after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      showSnackbar("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // For now, we'll just show a message that photo upload would require Firebase Storage
    showSnackbar(
      "Photo upload feature requires Firebase Storage setup",
      "info"
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Edit />
            <Typography variant="h6">Edit Profile</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            {/* Profile Photo Section */}
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={user?.photoURL || ""}
                alt={user?.displayName || user?.email}
                sx={{ width: 100, height: 100 }}
              />
              <IconButton
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": { bgcolor: "primary.dark" },
                  width: 32,
                  height: 32,
                }}
                component="label"
              >
                <PhotoCamera fontSize="small" />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </IconButton>
            </Box>

            {/* Profile Form */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <TextField
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
                required
                helperText="This name will be shown to other users"
              />

              <TextField
                label="Email"
                value={email}
                disabled
                fullWidth
                helperText="Email cannot be changed"
              />

              {userProfile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Member since:{" "}
                    {userProfile.createdAt?.toDate().toLocaleDateString()}
                  </Typography>
                  {userProfile.updatedAt && (
                    <Typography variant="body2" color="text.secondary">
                      Last updated: {userProfile.updatedAt.toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateProfile}
            disabled={loading || !displayName.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
