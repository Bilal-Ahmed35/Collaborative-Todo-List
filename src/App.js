import React, { useEffect, useState } from "react";
import {
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  Typography,
  Button,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Firebase/firebase";
import LoginScreen from "./components/LoginScreen";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import CreateListDialog from "./components/CreateListDialog";
import TaskDialog from "./components/TaskDialog";
import InviteDialog from "./components/InviteDialog";
import FilterMenu from "./components/FilterMenu";
import SortMenu from "./components/SortMenu";
import NotificationSnackbar from "./components/NotificationSnackbar";
import { useFirebaseData } from "./hooks/useFirebaseData";

const drawerWidth = 300;

export default function CollaborativeTodoApp() {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Theme and UI state
  const [darkMode, setDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: "#1976d2" },
      secondary: { main: "#dc004e" },
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
    },
  });

  // Firebase data hook (only initialize when user is authenticated)
  const firebaseData = useFirebaseData(user);

  // UI state
  const [activeListId, setActiveListId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [editingTask, setEditingTask] = useState(null);

  // Filter and sort state
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    assignee: "all",
    showOverdue: false,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (!user) {
        // Clear all data when user signs out
        setActiveListId(null);
        setSearchTerm("");
        setNotificationAnchor(null);
        setCreateListOpen(false);
        setTaskDialogOpen(false);
        setInviteOpen(false);
        setTabValue(0);
        setEditingTask(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Set initial active list when lists load - FIXED VERSION
  useEffect(() => {
    // Only set active list if:
    // 1. Firebase data has finished loading
    // 2. We have lists available
    // 3. No active list is currently set
    if (
      !firebaseData.loading &&
      firebaseData.lists.length > 0 &&
      !activeListId
    ) {
      // Find the first list the user can actually view
      const firstAccessibleList = firebaseData.lists.find((list) =>
        firebaseData.canUserView(list.id)
      );

      if (firstAccessibleList) {
        setActiveListId(firstAccessibleList.id);
      }
    }

    // Clear active list if it's no longer accessible
    if (!firebaseData.loading && activeListId) {
      const currentList = firebaseData.lists.find(
        (list) => list.id === activeListId
      );
      if (!currentList || !firebaseData.canUserView(activeListId)) {
        setActiveListId(null);
      }
    }
  }, [
    firebaseData.loading,
    firebaseData.lists,
    activeListId,
    firebaseData.canUserView,
  ]);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginScreen />
      </ThemeProvider>
    );
  }

  // Show loading screen while Firebase data loads - NEW ADDITION
  if (firebaseData.loading) {
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
          }}
        >
          <CircularProgress />
          <Box sx={{ mt: 2, textAlign: "center" }}>Loading your lists...</Box>
        </Box>
      </ThemeProvider>
    );
  }

  // Show error if Firebase data failed to load - NEW ADDITION
  if (firebaseData.error) {
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
            textAlign: "center",
            p: 3,
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Failed to load data
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Error: {firebaseData.error.message}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

  // Get current list and tasks
  const currentList = firebaseData.lists.find(
    (list) => list.id === activeListId
  );
  const currentTasks = activeListId
    ? firebaseData.tasks[activeListId] || []
    : [];

  // Apply filters and sorting to tasks
  const filteredTasks = currentTasks
    .filter((task) => {
      if (filters.status !== "all") {
        if (filters.status === "completed" && !task.done) return false;
        if (
          filters.status === "pending" &&
          (task.done || task.status === "In Progress")
        )
          return false;
        if (
          filters.status !== "completed" &&
          filters.status !== "pending" &&
          task.status !== filters.status
        )
          return false;
      }
      if (filters.priority !== "all" && task.priority !== filters.priority)
        return false;
      if (filters.assignee !== "all" && task.assignedToUid !== filters.assignee)
        return false;
      if (filters.showOverdue) {
        if (
          !task.deadline ||
          new Date(task.deadline) >= new Date() ||
          task.done
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "deadline" || sortBy === "createdAt") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Filter lists by search term
  const filteredLists = firebaseData.lists.filter(
    (list) =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (list.description &&
        list.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate stats
  const stats = {
    totalTasks: currentTasks.length,
    completedTasks: currentTasks.filter((task) => task.done).length,
    pendingTasks: currentTasks.filter((task) => !task.done).length,
    upcomingDeadlines: currentTasks.filter(
      (task) =>
        task.deadline &&
        new Date(task.deadline) > new Date() &&
        new Date(task.deadline) <=
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
        !task.done
    ).length,
  };

  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;
  const unreadNotifications = firebaseData.notifications.filter((n) => !n.read);

  // Utility functions
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const appProps = {
    user,
    activeListId,
    setActiveListId,
    searchTerm,
    setSearchTerm,
    notificationAnchor,
    setNotificationAnchor,
    createListOpen,
    setCreateListOpen,
    taskDialogOpen,
    setTaskDialogOpen,
    inviteOpen,
    setInviteOpen,
    tabValue,
    setTabValue,
    editingTask,
    setEditingTask,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filterAnchor,
    setFilterAnchor,
    sortAnchor,
    setSortAnchor,
    snackbar,
    setSnackbar,
    currentList,
    currentTasks,
    filteredTasks,
    filteredLists,
    stats,
    completionRate,
    unreadNotifications,
    showSnackbar,
    darkMode,
    setDarkMode,
    // Firebase data and operations
    ...firebaseData,
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex" }}>
        <AppHeader {...appProps} />
        <Sidebar {...appProps} drawerWidth={drawerWidth} />
        <MainContent {...appProps} />

        <CreateListDialog {...appProps} />
        <TaskDialog {...appProps} />
        <InviteDialog {...appProps} />
        <FilterMenu {...appProps} />
        <SortMenu {...appProps} />
        <NotificationSnackbar {...appProps} />
      </Box>
    </ThemeProvider>
  );
}
