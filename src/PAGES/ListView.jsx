import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Checkbox,
  List,
  ListItem,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
  Menu,
  Tooltip,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Paper,
  Divider,
  AvatarGroup,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CommentIcon from "@mui/icons-material/Comment";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import HistoryIcon from "@mui/icons-material/History";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FlagIcon from "@mui/icons-material/Flag";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { db } from "../Firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  getDocs,
  where,
  setDoc,
  arrayUnion,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function ListView({ listId, user }) {
  const [listDoc, setListDoc] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviteOpen, setInviteOpen] = useState(false);

  // Task creation/editing state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskStatus, setTaskStatus] = useState("Pending");
  const [taskDeadline, setTaskDeadline] = useState(null);
  const [taskAssignee, setTaskAssignee] = useState("");

  // UI state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [tabValue, setTabValue] = useState(0);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    assignee: "all",
    showOverdue: false,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("asc");
  const [taskMenuAnchor, setTaskMenuAnchor] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Comments and activity
  const [comments, setComments] = useState({});
  const [activities, setActivities] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState({});

  // Load list document and data
  useEffect(() => {
    if (!listId) return;

    // Load list document
    const listUnsub = onSnapshot(doc(db, "lists", listId), (snap) => {
      if (snap.exists()) {
        setListDoc({ id: snap.id, ...snap.data() });
      }
    });

    // Load tasks
    const tasksQuery = query(
      collection(db, "lists", listId, "tasks"),
      orderBy("order", "asc")
    );
    const tasksUnsub = onSnapshot(tasksQuery, (snap) => {
      const taskData = snap.docs.map((d, index) => ({
        id: d.id,
        ...d.data(),
        order: d.data().order ?? index,
      }));
      setTasks(taskData);
    });

    // Load members
    const loadMembers = async () => {
      try {
        const listSnap = await getDocs(
          query(collection(db, "lists"), where("__name__", "==", listId))
        );
        if (!listSnap.empty) {
          const listData = listSnap.docs[0].data();
          if (listData.memberIds?.length) {
            const usersQuery = query(
              collection(db, "users"),
              where("uid", "in", listData.memberIds)
            );
            const usersSnap = await getDocs(usersQuery);
            setMembers(usersSnap.docs.map((d) => d.data()));
          }
        }
      } catch (error) {
        console.error("Error loading members:", error);
      }
    };

    // Load activities
    const activitiesQuery = query(
      collection(db, "lists", listId, "activities"),
      orderBy("createdAt", "desc")
    );
    const activitiesUnsub = onSnapshot(activitiesQuery, (snap) => {
      setActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    loadMembers();

    return () => {
      listUnsub();
      tasksUnsub();
      activitiesUnsub();
    };
  }, [listId]);

  // Filter and sort tasks
  useEffect(() => {
    let filtered = [...tasks];

    // Apply filters
    if (filters.status !== "all") {
      if (filters.status === "completed") {
        filtered = filtered.filter((t) => t.done);
      } else if (filters.status === "pending") {
        filtered = filtered.filter(
          (t) => !t.done && t.status !== "In Progress"
        );
      } else {
        filtered = filtered.filter((t) => t.status === filters.status);
      }
    }

    if (filters.priority !== "all") {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }

    if (filters.assignee !== "all") {
      filtered = filtered.filter((t) => t.assignedToUid === filters.assignee);
    }

    if (filters.showOverdue) {
      filtered = filtered.filter(
        (t) => t.deadline && dayjs(t.deadline).isBefore(dayjs()) && !t.done
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "deadline" || sortBy === "createdAt") {
        aVal = aVal ? dayjs(aVal).valueOf() : 0;
        bVal = bVal ? dayjs(bVal).valueOf() : 0;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, filters, sortBy, sortOrder]);

  // Task operations
  const openTaskDialog = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title || "");
      setTaskDescription(task.description || "");
      setTaskPriority(task.priority || "Medium");
      setTaskStatus(task.status || "Pending");
      setTaskDeadline(task.deadline ? dayjs(task.deadline) : null);
      setTaskAssignee(task.assignedToUid || "");
    } else {
      setEditingTask(null);
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("Medium");
      setTaskStatus("Pending");
      setTaskDeadline(null);
      setTaskAssignee("");
    }
    setTaskDialogOpen(true);
  };

  const saveTask = async () => {
    if (!taskTitle.trim()) {
      showSnackbar("Task title is required", "error");
      return;
    }

    const taskData = {
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      priority: taskPriority,
      status: taskStatus,
      deadline: taskDeadline ? taskDeadline.toISOString() : null,
      assignedToUid: taskAssignee || null,
      done: taskStatus === "Completed",
    };

    try {
      if (editingTask) {
        await updateDoc(
          doc(db, "lists", listId, "tasks", editingTask.id),
          taskData
        );
        await logActivity(`updated task "${taskTitle}"`);
      } else {
        taskData.createdBy = user.uid;
        taskData.createdAt = serverTimestamp();
        taskData.order = tasks.length;
        await addDoc(collection(db, "lists", listId, "tasks"), taskData);
        await logActivity(`created task "${taskTitle}"`);
      }

      setTaskDialogOpen(false);
      showSnackbar(editingTask ? "Task updated" : "Task created", "success");
    } catch (error) {
      console.error("Error saving task:", error);
      showSnackbar("Failed to save task", "error");
    }
  };

  const deleteTask = async (taskId, taskTitle) => {
    try {
      await deleteDoc(doc(db, "lists", listId, "tasks", taskId));
      await logActivity(`deleted task "${taskTitle}"`);
      showSnackbar("Task deleted", "info");
    } catch (error) {
      console.error("Error deleting task:", error);
      showSnackbar("Failed to delete task", "error");
    }
  };

  const toggleTaskDone = async (task) => {
    try {
      const newStatus = task.done ? "Pending" : "Completed";
      await updateDoc(doc(db, "lists", listId, "tasks", task.id), {
        done: !task.done,
        status: newStatus,
      });
      await logActivity(
        `${task.done ? "reopened" : "completed"} task "${task.title}"`
      );
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  // Drag and drop
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(filteredTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order in Firestore
    const batch = writeBatch(db);
    items.forEach((item, index) => {
      const taskRef = doc(db, "lists", listId, "tasks", item.id);
      batch.update(taskRef, { order: index });
    });

    try {
      await batch.commit();
      await logActivity("reordered tasks");
    } catch (error) {
      console.error("Error reordering tasks:", error);
    }
  };

  // Invite member
  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;

    try {
      const userQuery = query(
        collection(db, "users"),
        where("email", "==", inviteEmail.trim())
      );
      const userSnap = await getDocs(userQuery);

      if (userSnap.empty) {
        // Create pending invitation
        await addDoc(collection(db, "pendingInvitations"), {
          email: inviteEmail.trim(),
          listId,
          listName: listDoc.name,
          role: inviteRole,
          invitedBy: user.uid,
          invitedByName: user.displayName || user.email,
          createdAt: serverTimestamp(),
        });
        showSnackbar(
          "Invitation sent! They'll get access when they sign up.",
          "success"
        );
      } else {
        // Add existing user to list
        const targetUser = userSnap.docs[0].data();
        await setDoc(
          doc(db, "lists", listId),
          {
            memberIds: arrayUnion(targetUser.uid),
            roles: { [targetUser.uid]: inviteRole },
          },
          { merge: true }
        );

        // Send notification to user
        await addDoc(collection(db, "notifications"), {
          userId: targetUser.uid,
          title: "New List Invitation",
          message: `${user.displayName || user.email} invited you to "${
            listDoc.name
          }"`,
          listId,
          read: false,
          createdAt: serverTimestamp(),
        });

        showSnackbar("User added to list!", "success");
      }

      setInviteEmail("");
      setInviteOpen(false);
      await logActivity(`invited ${inviteEmail} as ${inviteRole}`);
    } catch (error) {
      console.error("Error inviting member:", error);
      showSnackbar("Failed to invite member", "error");
    }
  };

  // Comments
  const addComment = async (taskId) => {
    if (!newComment.trim()) return;

    try {
      await addDoc(
        collection(db, "lists", listId, "tasks", taskId, "comments"),
        {
          text: newComment.trim(),
          authorId: user.uid,
          authorName: user.displayName || user.email,
          authorPhoto: user.photoURL || "",
          createdAt: serverTimestamp(),
        }
      );
      setNewComment("");
      await logActivity(`commented on task`);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Activity logging
  const logActivity = async (action) => {
    try {
      await addDoc(collection(db, "lists", listId, "activities"), {
        action,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL || "",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  // Utility functions
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "success";
      case "In Progress":
        return "info";
      case "Pending":
        return "default";
      default:
        return "default";
    }
  };

  const getMemberName = (uid) => {
    const member = members.find((m) => m.uid === uid);
    return member ? member.displayName || member.email : "Unknown";
  };

  const completionPercentage =
    tasks.length > 0
      ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)
      : 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="h5" sx={{ flexGrow: 1 }}>
                {listDoc?.name || "Loading..."}
              </Typography>
              <Chip
                label={`${completionPercentage}% Complete`}
                color="primary"
                variant="outlined"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openTaskDialog()}
                sx={{ ml: 2 }}
              >
                New Task
              </Button>
              <IconButton onClick={() => setInviteOpen(true)} sx={{ ml: 1 }}>
                <PersonAddIcon />
              </IconButton>
            </Box>

            {listDoc?.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {listDoc.description}
              </Typography>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
              />
              <AvatarGroup max={5}>
                {members.map((member) => (
                  <Avatar
                    key={member.uid}
                    src={member.photoURL}
                    alt={member.displayName || member.email}
                    sx={{ width: 32, height: 32 }}
                  />
                ))}
              </AvatarGroup>
            </Box>
          </CardContent>
        </Card>

        {/* Filter and Sort Controls */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button
              startIcon={<FilterListIcon />}
              onClick={(e) => setFilterAnchor(e.currentTarget)}
            >
              Filter
            </Button>
            <Button
              startIcon={<SortIcon />}
              onClick={(e) => setSortAnchor(e.currentTarget)}
            >
              Sort
            </Button>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2" color="text.secondary">
              {filteredTasks.length} of {tasks.length} tasks
            </Typography>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label="Tasks" />
            <Tab label="Activity" />
          </Tabs>
        </Box>

        {/* Tasks Tab */}
        {tabValue === 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tasks">
              {(provided) => (
                <List {...provided.droppableProps} ref={provided.innerRef}>
                  {filteredTasks.map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <ListItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{
                            mb: 1,
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 2,
                            bgcolor: snapshot.isDragging
                              ? "action.hover"
                              : "background.paper",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              width: "100%",
                              alignItems: "center",
                            }}
                          >
                            <Box {...provided.dragHandleProps} sx={{ mr: 1 }}>
                              <DragIndicatorIcon color="action" />
                            </Box>

                            <Checkbox
                              checked={task.done}
                              onChange={() => toggleTaskDone(task)}
                            />

                            <Box sx={{ flexGrow: 1, ml: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  textDecoration: task.done
                                    ? "line-through"
                                    : "none",
                                  opacity: task.done ? 0.6 : 1,
                                }}
                              >
                                {task.title}
                              </Typography>

                              {task.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
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
                                    label={dayjs(task.deadline).format(
                                      "MMM DD"
                                    )}
                                    size="small"
                                    color={
                                      dayjs(task.deadline).isBefore(dayjs()) &&
                                      !task.done
                                        ? "error"
                                        : "default"
                                    }
                                  />
                                )}
                                {task.assignedToUid && (
                                  <Chip
                                    label={getMemberName(task.assignedToUid)}
                                    size="small"
                                    avatar={
                                      <Avatar
                                        src={
                                          members.find(
                                            (m) => m.uid === task.assignedToUid
                                          )?.photoURL
                                        }
                                        sx={{ width: 20, height: 20 }}
                                      />
                                    }
                                  />
                                )}
                              </Stack>
                            </Box>

                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setShowComments((prev) => ({
                                    ...prev,
                                    [task.id]: !prev[task.id],
                                  }))
                                }
                              >
                                <CommentIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => openTaskDialog(task)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  setSelectedTask(task);
                                  setTaskMenuAnchor(e.currentTarget);
                                }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Stack>
                          </Box>

                          {/* Comments Section */}
                          {showComments[task.id] && (
                            <Accordion sx={{ width: "100%", mt: 2 }}>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography>Comments</Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                                  <TextField
                                    size="small"
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) =>
                                      setNewComment(e.target.value)
                                    }
                                    fullWidth
                                  />
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => addComment(task.id)}
                                  >
                                    Post
                                  </Button>
                                </Box>
                                {/* Comments would be loaded here */}
                              </AccordionDetails>
                            </Accordion>
                          )}
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Activity Tab */}
        {tabValue === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                {activities.slice(0, 20).map((activity) => (
                  <ListItem key={activity.id}>
                    <Avatar
                      src={activity.userPhoto}
                      sx={{ width: 32, height: 32, mr: 2 }}
                    />
                    <Box>
                      <Typography variant="body2">
                        <strong>{activity.userName}</strong> {activity.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.createdAt &&
                          dayjs(activity.createdAt.toDate()).fromNow()}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Task Dialog */}
        <Dialog
          open={taskDialogOpen}
          onClose={() => setTaskDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingTask ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
          >
            <TextField
              label="Title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={taskPriority}
                  label="Priority"
                  onChange={(e) => setTaskPriority(e.target.value)}
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
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {members.map((member) => (
                    <MenuItem key={member.uid} value={member.uid}>
                      {member.displayName || member.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <DatePicker
              label="Deadline"
              value={taskDeadline}
              onChange={setTaskDeadline}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveTask}>
              {editingTask ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Invite Dialog */}
        <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)}>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
          >
            <TextField
              label="Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              fullWidth
              type="email"
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteRole}
                label="Role"
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <MenuItem value="viewer">Viewer (Read-only)</MenuItem>
                <MenuItem value="editor">Editor (Can modify tasks)</MenuItem>
                <MenuItem value="owner">Owner (Full control)</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={inviteMember}>
              Send Invite
            </Button>
          </DialogActions>
        </Dialog>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
        >
          <Box sx={{ p: 2, minWidth: 200 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filter Tasks
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                size="small"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                size="small"
                value={filters.priority}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, priority: e.target.value }))
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.showOverdue}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      showOverdue: e.target.checked,
                    }))
                  }
                />
              }
              label="Show overdue only"
            />
          </Box>
        </Menu>

        {/* Sort Menu */}
        <Menu
          anchorEl={sortAnchor}
          open={Boolean(sortAnchor)}
          onClose={() => setSortAnchor(null)}
        >
          <Box sx={{ p: 2, minWidth: 200 }}>
            <Typography variant="subtitle2" gutterBottom>
              Sort By
            </Typography>
            {[
              { value: "createdAt", label: "Created Date" },
              { value: "deadline", label: "Deadline" },
              { value: "priority", label: "Priority" },
              { value: "title", label: "Title" },
            ].map((option) => (
              <MenuItem
                key={option.value}
                selected={sortBy === option.value}
                onClick={() => {
                  setSortBy(option.value);
                  setSortAnchor(null);
                }}
              >
                {option.label}
              </MenuItem>
            ))}
            <Divider sx={{ my: 1 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={sortOrder === "desc"}
                  onChange={(e) =>
                    setSortOrder(e.target.checked ? "desc" : "asc")
                  }
                />
              }
              label="Descending"
            />
          </Box>
        </Menu>

        {/* Task Menu */}
        <Menu
          anchorEl={taskMenuAnchor}
          open={Boolean(taskMenuAnchor)}
          onClose={() => setTaskMenuAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              openTaskDialog(selectedTask);
              setTaskMenuAnchor(null);
            }}
          >
            <EditIcon sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              deleteTask(selectedTask.id, selectedTask.title);
              setTaskMenuAnchor(null);
            }}
          >
            <DeleteIcon sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
