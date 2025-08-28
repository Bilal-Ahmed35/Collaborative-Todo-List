import React, { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  TextField,
  Button,
  AppBar,
  Avatar,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Badge,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Menu,
  MenuItem,
  Divider,
  LinearProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ListAltIcon from "@mui/icons-material/ListAlt";
import GroupIcon from "@mui/icons-material/Group";
import TodayIcon from "@mui/icons-material/Today";
import { db } from "../Firebase/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  orderBy,
  doc,
  updateDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import ListView from "./ListView";
import dayjs from "dayjs";

const drawerWidth = 300;

export default function Dashboard({
  user,
  onSignOut,
  darkMode,
  toggleDarkMode,
}) {
  const [lists, setLists] = useState([]);
  const [active, setActive] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    upcomingDeadlines: 0,
  });

  // Load user's lists
  useEffect(() => {
    const q = query(
      collection(db, "lists"),
      where("memberIds", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLists(docs);
      if (!active && docs[0]) setActive(docs[0].id);

      // Calculate stats
      calculateStats(docs);
    });
    return () => unsub();
  }, [user.uid, active]);

  // Load notifications
  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(notifs);
      setNotificationCount(notifs.length);
    });
    return () => unsub();
  }, [user.uid]);

  // Calculate dashboard stats
  const calculateStats = async (userLists) => {
    let totalTasks = 0;
    let completedTasks = 0;
    let upcomingDeadlines = 0;

    for (const list of userLists) {
      try {
        const tasksQuery = query(collection(db, "lists", list.id, "tasks"));
        const tasksSnap = await getDocs(tasksQuery);

        tasksSnap.docs.forEach((taskDoc) => {
          const task = taskDoc.data();
          totalTasks++;
          if (task.done) completedTasks++;

          // Check if deadline is within 7 days
          if (task.deadline) {
            const deadline = dayjs(task.deadline);
            const now = dayjs();
            if (
              deadline.diff(now, "days") <= 7 &&
              deadline.isAfter(now) &&
              !task.done
            ) {
              upcomingDeadlines++;
            }
          }
        });
      } catch (error) {
        console.error("Error calculating stats:", error);
      }
    }

    setStats({
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      upcomingDeadlines,
    });
  };

  async function createList() {
    if (!name.trim()) return;

    const listData = {
      name: name.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      ownerId: user.uid,
      memberIds: [user.uid],
      roles: { [user.uid]: "owner" },
      createdAt: serverTimestamp(),
    };

    try {
      const ref = await addDoc(collection(db, "lists"), listData);
      setName("");
      setDescription("");
      setDueDate("");
      setActive(ref.id);
      setCreateListOpen(false);
    } catch (error) {
      console.error("Error creating list:", error);
    }
  }

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        const notifRef = doc(db, "notifications", notif.id);
        batch.update(notifRef, { read: true });
      });
      await batch.commit();
      setNotificationAnchor(null);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const filteredLists = lists.filter(
    (list) =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (list.description &&
        list.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  return (
    <Box sx={{ display: "flex" }}>
      {/* Enhanced App Bar */}
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
            <IconButton color="inherit" onClick={handleNotificationClick}>
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Dark Mode Toggle */}
          <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
            <IconButton color="inherit" onClick={toggleDarkMode}>
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

          <IconButton color="inherit" onClick={onSignOut}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
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
          {notifications.length > 0 && (
            <Button size="small" onClick={markAllNotificationsAsRead}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography color="text.secondary">No new notifications</Typography>
          </MenuItem>
        ) : (
          notifications.map((notif) => (
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
                  {dayjs(notif.createdAt?.toDate()).fromNow()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Enhanced Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            top: 64,
          },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2 }}>
          {/* Stats Cards */}
          <Grid container spacing={1} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Card sx={{ textAlign: "center", p: 1 }}>
                <Typography variant="h6" color="primary">
                  {stats.totalTasks}
                </Typography>
                <Typography variant="caption">Total Tasks</Typography>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ textAlign: "center", p: 1 }}>
                <Typography variant="h6" color="success.main">
                  {stats.completedTasks}
                </Typography>
                <Typography variant="caption">Completed</Typography>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ p: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Progress: {completionRate}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={completionRate}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Card>
            </Grid>
          </Grid>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Your Lists ({filteredLists.length})
            </Typography>
            <Tooltip title="Create new list">
              <IconButton size="small" onClick={() => setCreateListOpen(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <List sx={{ maxHeight: 400, overflow: "auto" }}>
            {filteredLists.map((l) => (
              <ListItemButton
                key={l.id}
                selected={l.id === active}
                onClick={() => setActive(l.id)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemText
                  primary={l.name}
                  secondary={
                    <Box>
                      {l.description && (
                        <Typography variant="caption" display="block">
                          {l.description.substring(0, 50)}...
                        </Typography>
                      )}
                      <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                        <Chip
                          size="small"
                          label={`${l.memberIds?.length || 0} members`}
                          variant="outlined"
                        />
                        {l.dueDate && (
                          <Chip
                            size="small"
                            label={dayjs(l.dueDate).format("MMM DD")}
                            color={
                              dayjs(l.dueDate).isBefore(dayjs())
                                ? "error"
                                : "default"
                            }
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>

          {/* Upcoming Deadlines Alert */}
          {stats.upcomingDeadlines > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                {stats.upcomingDeadlines} task
                {stats.upcomingDeadlines > 1 ? "s" : ""} due this week
              </Typography>
            </Alert>
          )}
        </Box>
      </Drawer>

      {/* Create List Dialog */}
      <Dialog
        open={createListOpen}
        onClose={() => setCreateListOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New List</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <TextField
            label="List Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            label="Due Date (optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateListOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createList}
            disabled={!name.trim()}
          >
            Create List
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {active ? (
          <ListView listId={active} user={user} />
        ) : (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h4" gutterBottom color="text.secondary">
              Welcome to Collab Todo!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Select a list from the sidebar or create a new one to get started.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setCreateListOpen(true)}
            >
              Create Your First List
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
