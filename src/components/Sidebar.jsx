import React from "react";
import {
  Box,
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Grid,
  Card,
  LinearProgress,
  Tooltip,
  Chip,
  Alert,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { formatDate, isOverdue } from "../utils/helpers";

export default function Sidebar({
  drawerWidth,
  stats,
  completionRate,
  filteredLists,
  activeListId,
  setActiveListId,
  setCreateListOpen,
}) {
  return (
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
          {filteredLists.map((list) => (
            <ListItemButton
              key={list.id}
              selected={list.id === activeListId}
              onClick={() => setActiveListId(list.id)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemText
                primary={list.name}
                secondary={
                  <Box>
                    {list.description && (
                      <Typography variant="caption" display="block">
                        {list.description.substring(0, 50)}
                        {list.description.length > 50 && "..."}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={`${list.memberIds?.length || 0} members`}
                        variant="outlined"
                      />
                      {list.dueDate && (
                        <Chip
                          size="small"
                          label={formatDate(list.dueDate)}
                          color={isOverdue(list.dueDate) ? "error" : "default"}
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
  );
}
