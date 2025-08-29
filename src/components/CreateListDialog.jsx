import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

export default function CreateListDialog({
  createListOpen,
  setCreateListOpen,
  setActiveListId,
  user,
  createList,
  showSnackbar,
}) {
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [listDueDate, setListDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateList = async () => {
    if (!listName.trim()) {
      showSnackbar("List name is required", "error");
      return;
    }
    if (!listDueDate) {
      showSnackbar("Due date is required", "error");
      return;
    }

    setLoading(true);
    try {
      const listData = {
        name: listName.trim(),
        description: listDescription.trim(),
        dueDate: listDueDate,
      };

      const newListId = await createList(listData);
      setActiveListId(newListId);

      showSnackbar("List created successfully!", "success");
      handleClose();
    } catch (error) {
      console.error("Error creating list:", error);
      showSnackbar("Failed to create list", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setListName("");
    setListDescription("");
    setListDueDate("");
    setCreateListOpen(false);
  };

  return (
    <Dialog open={createListOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New List</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
      >
        <TextField
          label="List Name *"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          fullWidth
          required
          error={!listName.trim()}
          helperText={!listName.trim() ? "List name is required" : ""}
          disabled={loading}
        />
        <TextField
          label="Description (optional)"
          value={listDescription}
          onChange={(e) => setListDescription(e.target.value)}
          multiline
          rows={3}
          fullWidth
          disabled={loading}
        />
        <TextField
          label="Due Date *"
          type="date"
          value={listDueDate}
          onChange={(e) => setListDueDate(e.target.value)}
          fullWidth
          required
          error={!listDueDate}
          helperText={!listDueDate ? "Due date is required" : ""}
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
          onClick={handleCreateList}
          disabled={!listName.trim() || !listDueDate || loading}
        >
          {loading ? "Creating..." : "Create List"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
