import React from "react";
import {
  List,
  ListItem,
  Box,
  IconButton,
  Checkbox,
  Typography,
  Stack,
  Chip,
  Avatar,
  Card,
  CardContent,
  Button,
  Tooltip,
} from "@mui/material";
import {
  DragIndicator as DragIndicatorIcon,
  Comment as CommentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import {
  getPriorityColor,
  getStatusColor,
  formatDate,
  isOverdue,
  getMemberName,
} from "../utils/helpers";

export default function TaskList({
  filteredTasks,
  currentTasks,
  members,
  toggleTaskDone,
  deleteTask,
  openTaskDialog,
  canEdit,
  userRole,
}) {
  return (
    <List>
      {filteredTasks.map((task) => (
        <ListItem
          key={task.id}
          sx={{
            mb: 1,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              display: "flex",
              width: "100%",
              alignItems: "center",
            }}
          >
            {/* Drag Handle - Only show if user can edit */}
            {canEdit && (
              <IconButton size="small" sx={{ mr: 1, cursor: "grab" }}>
                <DragIndicatorIcon color="action" />
              </IconButton>
            )}

            {/* Task Completion Checkbox */}
            <Tooltip
              title={
                canEdit
                  ? task.done
                    ? "Mark as incomplete"
                    : "Mark as complete"
                  : "View-only access"
              }
            >
              <Checkbox
                checked={task.done}
                onChange={() => toggleTaskDone(task.id)}
                disabled={!canEdit}
              />
            </Tooltip>

            <Box sx={{ flexGrow: 1, ml: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  textDecoration: task.done ? "line-through" : "none",
                  opacity: task.done ? 0.6 : 1,
                }}
              >
                {task.title}
              </Typography>

              {task.description && (
                <Typography variant="body2" color="text.secondary">
                  {task.description}
                </Typography>
              )}

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip
                  label={task.priority}
                  size="small"
                  color={getPriorityColor(task.priority)}
                  icon={<FlagIcon />}
                />
                <Chip
                  label={task.status}
                  size="small"
                  color={getStatusColor(task.status)}
                />
                {task.deadline && (
                  <Chip
                    label={formatDate(task.deadline)}
                    size="small"
                    color={
                      isOverdue(task.deadline) && !task.done
                        ? "error"
                        : "default"
                    }
                    icon={<AccessTimeIcon />}
                  />
                )}
                {task.assignedToUid && (
                  <Chip
                    label={getMemberName(task.assignedToUid, members)}
                    size="small"
                    avatar={
                      <Avatar
                        src={
                          members.find((m) => m.uid === task.assignedToUid)
                            ?.photoURL
                        }
                        sx={{ width: 20, height: 20 }}
                      />
                    }
                  />
                )}
              </Stack>
            </Box>

            {/* Action Buttons */}
            <Stack direction="row" spacing={1}>
              <Tooltip title="Comments (Coming soon)">
                <IconButton size="small" disabled>
                  <CommentIcon />
                </IconButton>
              </Tooltip>

              {canEdit ? (
                <Tooltip title="Edit task">
                  <IconButton size="small" onClick={() => openTaskDialog(task)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="View-only access">
                  <IconButton size="small" disabled>
                    <LockIcon />
                  </IconButton>
                </Tooltip>
              )}

              {canEdit ? (
                <Tooltip title="Delete task">
                  <IconButton
                    size="small"
                    onClick={() => deleteTask(task.id, task.title)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="View-only access">
                  <IconButton size="small" disabled>
                    <LockIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        </ListItem>
      ))}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <Card sx={{ textAlign: "center", py: 4 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tasks found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {currentTasks.length === 0
                ? canEdit
                  ? "Create your first task to get started!"
                  : "No tasks have been created yet."
                : "Try adjusting your filters or search terms."}
            </Typography>
            {currentTasks.length === 0 && canEdit && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openTaskDialog()}
              >
                Create First Task
              </Button>
            )}
            {currentTasks.length === 0 && !canEdit && (
              <Typography variant="body2" color="text.secondary">
                You have {userRole} access to this list.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </List>
  );
}
