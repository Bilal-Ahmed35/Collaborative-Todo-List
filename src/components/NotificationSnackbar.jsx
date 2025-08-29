import React from "react";
import { Snackbar, Alert } from "@mui/material";

export default function NotificationSnackbar({ snackbar, setSnackbar }) {
  return (
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
  );
}
