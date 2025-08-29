import React from "react";
import {
  Menu,
  Box,
  Typography,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
} from "@mui/material";

export default function SortMenu({
  sortAnchor,
  setSortAnchor,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) {
  const sortOptions = [
    { value: "createdAt", label: "Created Date" },
    { value: "deadline", label: "Deadline" },
    { value: "priority", label: "Priority" },
    { value: "title", label: "Title" },
  ];

  return (
    <Menu
      anchorEl={sortAnchor}
      open={Boolean(sortAnchor)}
      onClose={() => setSortAnchor(null)}
    >
      <Box sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2" gutterBottom>
          Sort By
        </Typography>
        {sortOptions.map((option) => (
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
              onChange={(e) => setSortOrder(e.target.checked ? "desc" : "asc")}
            />
          }
          label="Descending"
        />
      </Box>
    </Menu>
  );
}
