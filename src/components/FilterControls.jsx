import React from "react";
import { Card, CardContent, Button, Typography, Divider } from "@mui/material";
import {
  FilterList as FilterListIcon,
  Sort as SortIcon,
} from "@mui/icons-material";

export default function FilterControls({
  filteredTasks,
  currentTasks,
  setFilterAnchor,
  setSortAnchor,
}) {
  return (
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
          {filteredTasks.length} of {currentTasks.length} tasks
        </Typography>
      </CardContent>
    </Card>
  );
}
