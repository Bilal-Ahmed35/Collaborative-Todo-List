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
  Radio,
  RadioGroup,
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
  const handleSortByChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleSortOrderChange = (event) => {
    setSortOrder(event.target.value);
  };

  return (
    <Menu
      anchorEl={sortAnchor}
      open={Boolean(sortAnchor)}
      onClose={() => setSortAnchor(null)}
      PaperProps={{ sx: { minWidth: 250 } }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Sort Tasks
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            size="small"
            value={sortBy}
            label="Sort By"
            onChange={handleSortByChange}
          >
            <MenuItem value="createdAt">Date Created</MenuItem>
            <MenuItem value="deadline">Deadline</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="status">Status</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 1 }} />

        <Typography variant="body2" gutterBottom>
          Order
        </Typography>
        <RadioGroup
          value={sortOrder}
          onChange={handleSortOrderChange}
          size="small"
        >
          <FormControlLabel
            value="desc"
            control={<Radio size="small" />}
            label={getSortLabel(sortBy, "desc")}
          />
          <FormControlLabel
            value="asc"
            control={<Radio size="small" />}
            label={getSortLabel(sortBy, "asc")}
          />
        </RadioGroup>
      </Box>
    </Menu>
  );
}

function getSortLabel(sortBy, order) {
  const labels = {
    createdAt: {
      desc: "Newest first",
      asc: "Oldest first",
    },
    deadline: {
      desc: "Latest deadline first",
      asc: "Earliest deadline first",
    },
    priority: {
      desc: "High to Low",
      asc: "Low to High",
    },
    title: {
      desc: "Z to A",
      asc: "A to Z",
    },
    status: {
      desc: "Completed first",
      asc: "Pending first",
    },
  };

  return (
    labels[sortBy]?.[order] || (order === "desc" ? "Descending" : "Ascending")
  );
}
