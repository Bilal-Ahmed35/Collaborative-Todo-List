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
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
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
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter((n) => !n.read);
      await Promise.all(
        unreadNotifs.map((notif) =>
          updateNotification(notif.id, { read: true })
        )
      );
      setNotificationAnchor(null);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
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
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={(e) => setNotificationAnchor(e.currentTarget)}
            >
              <Badge badgeContent={unreadNotifications.length} color="error">
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
        PaperProps={{ sx: { width: 350, maxHeight: 400 } }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Notifications</Typography>
          {unreadNotifications.length > 0 && (
            <Button size="small" onClick={markAllNotificationsAsRead}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />
        {unreadNotifications.length === 0 ? (
          <MenuItem>
            <Typography color="text.secondary">No new notifications</Typography>
          </MenuItem>
        ) : (
          unreadNotifications.map((notif) => (
            <MenuItem
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              sx={{ whiteSpace: "normal", py: 1.5 }}
            >
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {notif.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {notif.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(notif.createdAt)}
                </Typography>
              </Box>
            </MenuItem>
          ))
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
