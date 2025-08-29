import React from "react";
import {
  Menu,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";

export default function FilterMenu({
  filterAnchor,
  setFilterAnchor,
  filters,
  setFilters,
}) {
  return (
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
            label="Status"
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
            label="Priority"
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
  );
}
