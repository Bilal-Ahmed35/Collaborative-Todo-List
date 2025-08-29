import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

export default function TaskDialog({
  taskDialogOpen,
  setTaskDialogOpen,
  editingTask,
  setEditingTask,
  activeListId,
  currentList,
  members,
  user,
  createTask,
  updateTask,
  showSnackbar,
  canUserEdit,
}) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskStatus, setTaskStatus] = useState("Pending");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTaskTitle(editingTask.title || "");
      setTaskDescription(editingTask.description || "");
      setTaskPriority(editingTask.priority || "Medium");
      setTaskStatus(editingTask.status || "Pending");
      setTaskDeadline(editingTask.deadline || "");
      setTaskAssignee(editingTask.assignedToUid || "");
    } else {
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("Medium");
      setTaskStatus("Pending");
      setTaskDeadline("");
      setTaskAssignee("");
    }
  }, [editingTask]);

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) {
      showSnackbar("Task title is required", "error");
      return;
    }
    if (!taskDeadline) {
      showSnackbar("Due date is required", "error");
      return;
    }

    if (!canUserEdit(activeListId)) {
      showSnackbar("You don't have permission to modify tasks", "error");
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: taskPriority,
        status: taskStatus,
        deadline: taskDeadline,
        assignedToUid: taskAssignee || null,
        done: taskStatus === "Completed",
      };

      if (editingTask) {
        await updateTask(activeListId, editingTask.id, {
          ...editingTask,
          ...taskData,
        });
        showSnackbar("Task updated successfully!", "success");
      } else {
        await createTask(activeListId, taskData);
        showSnackbar("Task created successfully!", "success");
      }

      handleClose();
    } catch (error) {
      console.error("Error saving task:", error);
      showSnackbar(error.message || "Failed to save task", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTaskDialogOpen(false);
    setEditingTask(null);
  };

  // Get list members for assignment dropdown
  const listMembers = members.filter((m) =>
    currentList?.memberIds.includes(m.uid)
  );

  return (
    <Dialog open={taskDialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
      >
        <TextField
          label="Title *"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          fullWidth
          required
          error={!taskTitle.trim()}
          helperText={!taskTitle.trim() ? "Task title is required" : ""}
          disabled={loading}
        />
        <TextField
          label="Description"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          multiline
          rows={3}
          fullWidth
          disabled={loading}
        />
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={taskPriority}
              label="Priority"
              onChange={(e) => setTaskPriority(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={taskStatus}
              label="Status"
              onChange={(e) => setTaskStatus(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Assign to</InputLabel>
            <Select
              value={taskAssignee}
              label="Assign to"
              onChange={(e) => setTaskAssignee(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {listMembers.map((member) => (
                <MenuItem key={member.uid} value={member.uid}>
                  {member.displayName || member.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <TextField
          label="Deadline *"
          type="date"
          value={taskDeadline}
          onChange={(e) => setTaskDeadline(e.target.value)}
          fullWidth
          required
          error={!taskDeadline}
          helperText={!taskDeadline ? "Due date is required" : ""}
          InputLabelProps={{ shrink: true }}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveTask}
          disabled={!taskTitle.trim() || !taskDeadline || loading}
        >
          {loading
            ? editingTask
              ? "Updating..."
              : "Creating..."
            : editingTask
            ? "Update"
            : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
