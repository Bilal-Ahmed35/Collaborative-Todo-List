import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Box,
} from "@mui/material";
// Import the email service
import { sendInvitationEmail } from "../services/emailService";

export default function InviteDialog({
  inviteOpen,
  setInviteOpen,
  currentList,
  user,
  activeListId,
  inviteMember,
  showSnackbar,
  getUserRole,
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [loading, setLoading] = useState(false);

  const userRole = getUserRole(activeListId);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      showSnackbar("Email is required", "error");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      showSnackbar("Please enter a valid email address", "error");
      return;
    }

    // Check if user is already a member
    const existingMember = currentList?.memberIds?.find(
      (memberId) => memberId === inviteEmail.trim()
    );
    if (existingMember) {
      showSnackbar("User is already a member of this list", "error");
      return;
    }

    // Check permissions
    if (userRole !== "owner" && userRole !== "editor") {
      showSnackbar("Only owners and editors can invite members", "error");
      return;
    }

    // Only owners can invite other owners
    if (inviteRole === "owner" && userRole !== "owner") {
      showSnackbar("Only list owners can invite other owners", "error");
      return;
    }

    setLoading(true);
    try {
      // First, add member to the database
      await inviteMember(activeListId, inviteEmail.trim(), inviteRole);

      // Then send the invitation email
      try {
        await sendInvitationEmail({
          email: inviteEmail.trim(),
          listName: currentList?.name || "Untitled List",
          invitedByName: user?.displayName || user?.email || "Someone",
          role: inviteRole,
          listId: activeListId,
        });
        showSnackbar(
          "Invitation sent successfully! Email has been sent.",
          "success"
        );
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Still show success for database operation, but mention email issue
        showSnackbar(
          "Member added successfully, but email sending failed. Please share the list manually.",
          "warning"
        );
      }

      handleClose();
    } catch (error) {
      console.error("Error inviting member:", error);
      showSnackbar(error.message || "Failed to send invitation", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInviteEmail("");
    setInviteRole("editor");
    setInviteOpen(false);
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case "viewer":
        return "Can view tasks and activity but cannot make changes";
      case "editor":
        return "Can create, edit, and delete tasks";
      case "owner":
        return "Full control including member management and list deletion";
      default:
        return "";
    }
  };

  return (
    <Dialog open={inviteOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Invite Member to "{currentList?.name}"</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
      >
        {/* Permission Alert */}
        {userRole === "viewer" && (
          <Alert severity="error">
            You don't have permission to invite members to this list.
          </Alert>
        )}

        {userRole !== "viewer" && (
          <>
            <Typography variant="body2" color="text.secondary">
              Send an invitation to collaborate on this list. The person will
              receive an email with instructions to join.
            </Typography>

            <TextField
              label="Email Address *"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              fullWidth
              type="email"
              required
              error={
                inviteEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)
              }
              helperText={
                inviteEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)
                  ? "Please enter a valid email address"
                  : "Enter the email address of the person you want to invite"
              }
              disabled={loading}
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteRole}
                label="Role"
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="viewer">Viewer</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                {userRole === "owner" && (
                  <MenuItem value="owner">Owner</MenuItem>
                )}
              </Select>
            </FormControl>

            <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                {inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1)}{" "}
                Permissions:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getRoleDescription(inviteRole)}
              </Typography>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                The invited person will receive an email with a link to join
                this list. They'll need to sign up with this exact email address
                to access it.
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {userRole !== "viewer" && (
          <Button
            variant="contained"
            onClick={handleInviteMember}
            disabled={
              !inviteEmail.trim() ||
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail) ||
              loading
            }
          >
            {loading ? "Sending..." : "Send Invite"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
