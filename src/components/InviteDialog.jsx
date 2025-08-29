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
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import {
  sendInvitationEmail,
  shareInvitationLink,
  isEmailServiceAvailable,
} from "../services/emailService";

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
  const [inviteMethod, setInviteMethod] = useState("email"); // 'email', 'link'
  const [emailError, setEmailError] = useState(""); // Separate state for error message

  const userRole = getUserRole(activeListId);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setInviteEmail(email);

    // Clear error when user starts typing
    if (emailError) {
      setEmailError("");
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      setEmailError("Email is required");
      showSnackbar("Email is required", "error");
      return;
    }

    if (!validateEmail(inviteEmail.trim())) {
      setEmailError("Please enter a valid email address");
      showSnackbar("Please enter a valid email address", "error");
      return;
    }

    // Check if user is already a member
    if (currentList?.memberIds?.includes(inviteEmail.trim())) {
      setEmailError("User is already a member of this list");
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

      // Then try to send notification based on method
      const invitationData = {
        email: inviteEmail.trim(),
        listName: currentList?.name || "Untitled List",
        invitedByName: user?.displayName || user?.email || "Someone",
        role: inviteRole,
        listId: activeListId,
      };

      if (inviteMethod === "email" && isEmailServiceAvailable()) {
        try {
          await sendInvitationEmail(invitationData);
          showSnackbar(
            "Invitation sent successfully! Email has been sent.",
            "success"
          );
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
          // Fall back to link sharing
          const shareResult = await shareInvitationLink(invitationData);
          if (shareResult.method === "clipboard") {
            showSnackbar(
              "Member added successfully. Invitation link copied to clipboard since email failed.",
              "warning"
            );
          } else {
            showSnackbar(
              "Member added successfully, but email sending failed. Please share the invitation link manually.",
              "warning"
            );
          }
        }
      } else {
        // Use link sharing method
        const shareResult = await shareInvitationLink(invitationData);
        if (shareResult.method === "native-share") {
          showSnackbar("Invitation shared successfully!", "success");
        } else if (shareResult.method === "clipboard") {
          showSnackbar("Invitation link copied to clipboard!", "success");
        } else {
          showSnackbar(`Invitation link: ${shareResult.url}`, "info");
        }
      }

      handleClose();
    } catch (error) {
      console.error("Error inviting member:", error);
      showSnackbar(error.message || "Failed to send invitation", "error");
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = () => {
    return `${
      window.location.origin
    }/?invite=${activeListId}&email=${encodeURIComponent(inviteEmail)}`;
  };

  const copyInviteLink = async () => {
    if (!inviteEmail.trim()) {
      setEmailError("Please enter a valid email address first");
      showSnackbar("Please enter a valid email address first", "error");
      return;
    }

    if (!validateEmail(inviteEmail.trim())) {
      setEmailError("Please enter a valid email address first");
      showSnackbar("Please enter a valid email address first", "error");
      return;
    }

    const link = generateInviteLink();
    try {
      await navigator.clipboard.writeText(link);
      showSnackbar("Invitation link copied to clipboard!", "success");
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showSnackbar("Invitation link copied to clipboard!", "success");
    }
  };

  const handleClose = () => {
    setInviteEmail("");
    setInviteRole("editor");
    setInviteMethod("email");
    setEmailError(""); // Clear error state
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

  const isEmailAvailable = isEmailServiceAvailable();
  const hasEmailError = Boolean(emailError);
  const isValidEmail = inviteEmail.trim() && validateEmail(inviteEmail.trim());

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
              Invite someone to collaborate on this list. They'll need to sign
              in with the email address you specify.
            </Typography>

            {/* Email Input */}
            <TextField
              label="Email Address *"
              value={inviteEmail}
              onChange={handleEmailChange}
              fullWidth
              type="email"
              required
              error={hasEmailError} // Boolean value
              helperText={
                emailError || // Show error message if there is one
                "Enter the email address of the person you want to invite"
              }
              disabled={loading}
            />

            {/* Role Selection */}
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

            {/* Role Description */}
            <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                {inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1)}{" "}
                Permissions:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getRoleDescription(inviteRole)}
              </Typography>
            </Box>

            {/* Invitation Method Selection */}
            <Box
              sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}
            >
              <Typography variant="subtitle2" gutterBottom>
                How would you like to send the invitation?
              </Typography>

              {isEmailAvailable ? (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    variant={
                      inviteMethod === "email" ? "contained" : "outlined"
                    }
                    size="small"
                    startIcon={<EmailIcon />}
                    onClick={() => setInviteMethod("email")}
                  >
                    Send Email
                  </Button>
                  <Button
                    variant={inviteMethod === "link" ? "contained" : "outlined"}
                    size="small"
                    startIcon={<ShareIcon />}
                    onClick={() => setInviteMethod("link")}
                  >
                    Share Link
                  </Button>
                  <Tooltip title="Copy invitation link">
                    <IconButton size="small" onClick={copyInviteLink}>
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Box>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    Email service not configured. You can share the invitation
                    link instead.
                  </Alert>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={copyInviteLink}
                    fullWidth
                  >
                    Copy Invitation Link
                  </Button>
                </Box>
              )}
            </Box>

            {/* Instructions */}
            <Alert severity="info">
              <Typography variant="body2">
                {inviteMethod === "email" && isEmailAvailable ? (
                  <>
                    The person will receive an email with instructions to join
                    this list.
                  </>
                ) : (
                  <>
                    Share the invitation link with the person. They'll need to
                    sign in with the exact email address you entered above to
                    access the list.
                  </>
                )}
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
            disabled={!isValidEmail || hasEmailError || loading}
          >
            {loading
              ? "Sending..."
              : inviteMethod === "email" && isEmailAvailable
              ? "Send Invite"
              : "Create Invite"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
