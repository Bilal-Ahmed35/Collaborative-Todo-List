import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";
import {
  List as ListIcon,
  Add as AddIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { formatDate } from "../utils/helpers";

export default function Sidebar({
  user,
  activeListId,
  setActiveListId,
  lists,
  filteredLists,
  setCreateListOpen,
  stats,
  completionRate,
  drawerWidth,
  canUserView,
}) {
  const handleListClick = (listId) => {
    if (!canUserView(listId)) {
      console.warn("User cannot view list:", listId);
      return;
    }
    setActiveListId(listId);
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

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          mt: 8,
        },
      }}
    >
      <Box sx={{ overflow: "auto", p: 2 }}>
        {/* User Info */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ pb: "16px !important" }}>
            <Typography variant="h6" gutterBottom>
              Welcome back!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.displayName || user.email}
            </Typography>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {activeListId && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ pb: "16px !important" }}>
              <Typography variant="subtitle2" gutterBottom>
                Current List Stats
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Progress
                </Typography>
                <Typography variant="body2" color="primary">
                  {completionRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionRate}
                sx={{ mb: 2, height: 6, borderRadius: 3 }}
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                  "& > div": {
                    textAlign: "center",
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "action.hover",
                  },
                }}
              >
                <Box>
                  <Typography variant="h6" color="success.main">
                    {stats.completedTasks}
                  </Typography>
                  <Typography variant="caption">Done</Typography>
                </Box>
                <Box>
                  <Typography variant="h6" color="warning.main">
                    {stats.pendingTasks}
                  </Typography>
                  <Typography variant="caption">Pending</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Create List Button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateListOpen(true)}
          sx={{ mb: 2 }}
        >
          New List
        </Button>

        <Divider sx={{ my: 2 }} />

        {/* Lists */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Your Lists ({filteredLists.length})
        </Typography>

        <List>
          {filteredLists.map((list) => {
            const userRole = list.roles?.[user.uid] || "viewer";
            const isActive = activeListId === list.id;
            const canView = canUserView(list.id);

            if (!canView) return null;

            return (
              <ListItem key={list.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleListClick(list.id)}
                  sx={{
                    borderRadius: 1,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                      "& .MuiChip-root": {
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "inherit",
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? "inherit" : "action.active",
                      minWidth: 40,
                    }}
                  >
                    <ListIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={list.name}
                    secondary={
                      // FIXED: Wrap in Typography with component="div"
                      <Typography
                        component="div"
                        variant="caption"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <Chip
                            label={userRole}
                            size="small"
                            color={getRoleColor(userRole)}
                            sx={{ fontSize: "0.6rem", height: 18 }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: isActive
                                ? "rgba(255,255,255,0.7)"
                                : "text.secondary",
                            }}
                          >
                            {list.memberIds?.length || 1} members
                          </Typography>
                        </Box>
                        {list.dueDate && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: isActive
                                ? "rgba(255,255,255,0.7)"
                                : "text.secondary",
                            }}
                          >
                            Due: {formatDate(list.dueDate)}
                          </Typography>
                        )}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}

          {filteredLists.length === 0 && (
            <ListItem>
              <ListItemText
                primary={
                  <Typography color="text.secondary" align="center">
                    {lists.length === 0
                      ? "No lists yet"
                      : "No lists match your search"}
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>

        {/* Quick Actions */}
        {lists.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Quick Stats
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">
                  {lists.reduce(
                    (acc, list) =>
                      acc +
                      (stats.totalTasks > 0 && list.id === activeListId
                        ? stats.completedTasks
                        : 0),
                    0
                  )}{" "}
                  tasks completed today
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PeopleIcon color="info" fontSize="small" />
                <Typography variant="body2">
                  Member of {lists.length} list{lists.length !== 1 ? "s" : ""}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ScheduleIcon color="warning" fontSize="small" />
                <Typography variant="body2">
                  {stats.upcomingDeadlines} upcoming deadlines
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
