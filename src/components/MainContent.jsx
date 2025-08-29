import React from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  AvatarGroup,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import TaskList from "./TaskList";
import ActivityList from "./ActivityList";
import FilterControls from "./FilterControls";

export default function MainContent({
  user,
  activeListId,
  currentList,
  completionRate,
  members,
  filteredTasks,
  currentTasks,
  tabValue,
  setTabValue,
  setTaskDialogOpen,
  setInviteOpen,
  setCreateListOpen,
  activities,
  updateTask,
  deleteTask: deleteTaskFirebase,
  setEditingTask,
  setFilterAnchor,
  setSortAnchor,
  showSnackbar,
  getUserRole,
  canUserEdit,
  canUserView,
}) {
  const userRole = getUserRole(activeListId);
  const canEdit = canUserEdit(activeListId);
  const canView = canUserView(activeListId);

  const openTaskDialog = (task = null) => {
    if (!canEdit && !task) {
      showSnackbar("You don't have permission to create tasks", "error");
      return;
    }
    if (!canEdit && task) {
      showSnackbar("You don't have permission to edit tasks", "error");
      return;
    }
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleInviteOpen = () => {
    if (userRole !== "owner" && userRole !== "editor") {
      showSnackbar("Only owners and editors can invite members", "error");
      return;
    }
    setInviteOpen(true);
  };

  const toggleTaskDone = async (taskId) => {
    if (!canEdit) {
      showSnackbar("You don't have permission to modify tasks", "error");
      return;
    }

    try {
      const task = currentTasks.find((t) => t.id === taskId);
      if (!task) return;

      const newDone = !task.done;
      const newStatus = newDone ? "Completed" : "Pending";

      await updateTask(activeListId, taskId, {
        ...task,
        done: newDone,
        status: newStatus,
      });

      showSnackbar(
        newDone ? "Task marked as complete" : "Task reopened",
        "success"
      );
    } catch (error) {
      console.error("Error updating task:", error);
      showSnackbar("Failed to update task", "error");
    }
  };

  const deleteTask = async (taskId, taskTitle) => {
    if (!canEdit) {
      showSnackbar("You don't have permission to delete tasks", "error");
      return;
    }

    try {
      await deleteTaskFirebase(activeListId, taskId, taskTitle);
      showSnackbar("Task deleted", "info");
    } catch (error) {
      console.error("Error deleting task:", error);
      showSnackbar("Failed to delete task", "error");
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

  const getRoleDescription = (role) => {
    switch (role) {
      case "owner":
        return "Full control - can manage members and delete list";
      case "editor":
        return "Can create, edit, and delete tasks";
      case "viewer":
        return "Read-only access - can view tasks and activity";
      default:
        return "No access";
    }
  };

  if (!canView) {
    return (
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Alert severity="error" sx={{ textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            You don't have permission to view this list. Contact the list owner
            for access.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
      {activeListId && currentList ? (
        <Box>
          {/* Header */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography variant="h5" sx={{ flexGrow: 1 }}>
                  {currentList.name}
                </Typography>

                {/* User Role Indicator */}
                <Tooltip title={getRoleDescription(userRole)}>
                  <Chip
                    label={`${userRole} role`}
                    color={getRoleColor(userRole)}
                    size="small"
                    sx={{ mr: 2 }}
                  />
                </Tooltip>

                <Chip
                  label={`${completionRate}% Complete`}
                  color="primary"
                  variant="outlined"
                />

                {/* Action Buttons */}
                {canEdit ? (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openTaskDialog()}
                    sx={{ ml: 2 }}
                  >
                    New Task
                  </Button>
                ) : (
                  <Tooltip title="View-only access - cannot create tasks">
                    <Button
                      variant="outlined"
                      startIcon={<LockIcon />}
                      disabled
                      sx={{ ml: 2 }}
                    >
                      View Only
                    </Button>
                  </Tooltip>
                )}

                {userRole === "owner" || userRole === "editor" ? (
                  <Tooltip title="Invite member">
                    <Button
                      variant="outlined"
                      onClick={handleInviteOpen}
                      sx={{ ml: 1 }}
                    >
                      <PersonAddIcon />
                    </Button>
                  </Tooltip>
                ) : (
                  <Tooltip title="Only owners and editors can invite members">
                    <Button variant="outlined" disabled sx={{ ml: 1 }}>
                      <LockIcon />
                    </Button>
                  </Tooltip>
                )}
              </Box>

              {currentList.description && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {currentList.description}
                </Typography>
              )}

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}
              >
                <LinearProgress
                  variant="determinate"
                  value={completionRate}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
                <AvatarGroup max={5}>
                  {members
                    .filter((m) => currentList.memberIds.includes(m.uid))
                    .map((member) => (
                      <Tooltip
                        key={member.uid}
                        title={`${member.displayName || member.email} (${
                          currentList.roles[member.uid]
                        })`}
                      >
                        <Avatar
                          src={member.photoURL}
                          alt={member.displayName || member.email}
                          sx={{ width: 32, height: 32 }}
                        />
                      </Tooltip>
                    ))}
                </AvatarGroup>
              </Box>
            </CardContent>
          </Card>

          {/* Role-based Access Alert */}
          {userRole === "viewer" && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                You have viewer access to this list. You can view tasks and
                activity but cannot make changes.
              </Typography>
            </Alert>
          )}

          {/* Filter and Sort Controls */}
          <FilterControls
            filteredTasks={filteredTasks}
            currentTasks={currentTasks}
            setFilterAnchor={setFilterAnchor}
            setSortAnchor={setSortAnchor}
          />

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
            >
              <Tab label={`Tasks (${filteredTasks.length})`} />
              <Tab label="Activity" />
            </Tabs>
          </Box>

          {/* Tasks Tab */}
          {tabValue === 0 && (
            <TaskList
              filteredTasks={filteredTasks}
              currentTasks={currentTasks}
              members={members}
              toggleTaskDone={toggleTaskDone}
              deleteTask={deleteTask}
              openTaskDialog={openTaskDialog}
              canEdit={canEdit}
              userRole={userRole}
            />
          )}

          {/* Activity Tab */}
          {tabValue === 1 && (
            <ActivityList activities={activities[activeListId] || []} />
          )}
        </Box>
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
  );
}
