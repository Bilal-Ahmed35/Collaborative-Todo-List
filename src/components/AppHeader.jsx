import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  IconButton,
  Badge,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemText,
  ListItemAvatar,
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  NotificationsNone as NotificationsNoneIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";
import { signOut } from "firebase/auth";
import { auth } from "../Firebase/firebase";
import { formatDate } from "../utils/helpers";

export default function AppHeader({
  user,
  searchTerm,
  setSearchTerm,
  darkMode,
  setDarkMode,
  unreadNotifications,
  notificationAnchor,
  setNotificationAnchor,
  notifications,
  updateNotification,
}) {
  const [signOutDialog, setSignOutDialog] = useState(false);

  const markNotificationAsRead = async (notificationId) => {
    try {
      await updateNotification(notificationId, { read: true });
      console.log("✅ Notification marked as read:", notificationId);
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter((n) => !n.read);
      console.log("📤 Marking all notifications as read:", unreadNotifs.length);

      const promises = unreadNotifs.map((notif) =>
        updateNotification(notif.id, { read: true })
      );

      await Promise.all(promises);
      setNotificationAnchor(null);
      console.log("✅ All notifications marked as read");
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSignOutDialog(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    // Close menu after a short delay to show the read state change
    setTimeout(() => {
      setNotificationAnchor(null);
    }, 300);
  };

  const getNotificationIcon = (notification) => {
    if (notification.type === "invitation") return "🎉";
    if (notification.type === "task_assignment") return "📝";
    if (notification.type === "task_completion") return "✅";
    if (notification.type === "welcome") return "👋";
    if (notification.type === "invitation_accepted") return "🤝";
    if (notification.type === "invitation_declined") return "❌";
    return "🔔";
  };

  // Sort notifications by date, unread first
  const sortedNotifications = [...notifications].sort((a, b) => {
    // Unread notifications first
    if (a.read !== b.read) {
      return a.read ? 1 : -1;
    }
    // Then by date (newest first)
    const dateA = a.createdAt || new Date(0);
    const dateB = b.createdAt || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  console.log("🔔 Notifications in header:", {
    total: notifications.length,
    unread: unreadNotifications.length,
    sorted: sortedNotifications.length,
  });

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: "flex", gap: 2 }}>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Collab Todo
          </Typography>

          {/* Search */}
          <TextField
            size="small"
            placeholder="Search lists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              "& .MuiInputBase-root": {
                color: "white",
                "& fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                "&:hover fieldset": { borderColor: "white" },
                "&.Mui-focused fieldset": { borderColor: "white" },
              },
              "& .MuiInputBase-input::placeholder": {
                color: "rgba(255,255,255,0.7)",
              },
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "white", mr: 1 }} />,
            }}
          />

          {/* Notifications */}
          <Tooltip title={`${unreadNotifications.length} unread notifications`}>
            <IconButton
              color="inherit"
              onClick={(e) => setNotificationAnchor(e.currentTarget)}
            >
              <Badge
                badgeContent={unreadNotifications.length}
                color="error"
                max={99}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Dark Mode Toggle */}
          <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
            <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* User Profile */}
          <Tooltip title={user.displayName || user.email}>
            <Avatar
              src={user.photoURL || ""}
              alt={user.displayName || user.email}
              sx={{ width: 32, height: 32 }}
            />
          </Tooltip>

          <Tooltip title="Sign Out">
            <IconButton color="inherit" onClick={() => setSignOutDialog(true)}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={() => setNotificationAnchor(null)}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            "& .MuiMenuItem-root": {
              whiteSpace: "normal",
              minHeight: "auto",
            },
          },
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6">Notifications</Typography>
          {unreadNotifications.length > 0 && (
            <Button
              size="small"
              onClick={markAllNotificationsAsRead}
              variant="outlined"
            >
              Mark all read
            </Button>
          )}
        </Box>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
          {sortedNotifications.length === 0 ? (
            <MenuItem disabled>
              <Box sx={{ textAlign: "center", py: 2, width: "100%" }}>
                <NotificationsNoneIcon
                  sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  No notifications yet
                </Typography>
              </Box>
            </MenuItem>
          ) : (
            sortedNotifications.map((notif) => (
              <MenuItem
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderLeft: !notif.read
                    ? "3px solid"
                    : "3px solid transparent",
                  borderColor: !notif.read ? "primary.main" : "transparent",
                  bgcolor: !notif.read ? "action.hover" : "transparent",
                  "&:hover": {
                    bgcolor: !notif.read ? "action.selected" : "action.hover",
                  },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                    }}
                  >
                    {getNotificationIcon(notif)}
                  </Box>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={!notif.read ? "bold" : "normal"}
                        sx={{ flexGrow: 1 }}
                      >
                        {notif.title}
                      </Typography>
                      {!notif.read && (
                        <CircleIcon
                          sx={{
                            fontSize: 8,
                            color: "primary.main",
                            mt: 0.5,
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        {notif.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(notif.createdAt)}
                      </Typography>
                    </Box>
                  }
                />
              </MenuItem>
            ))
          )}
        </Box>

        {notifications.length > 10 && (
          <Box
            sx={{
              p: 1,
              textAlign: "center",
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Showing recent notifications
            </Typography>
          </Box>
        )}
      </Menu>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={signOutDialog} onClose={() => setSignOutDialog(false)}>
        <DialogTitle>Sign Out</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to sign out? Your data will be saved and
            synced when you sign back in.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignOutDialog(false)}>Cancel</Button>
          <Button onClick={handleSignOut} variant="contained" color="error">
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
