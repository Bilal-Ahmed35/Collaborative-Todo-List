import React from "react";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Avatar,
  Box,
} from "@mui/material";
import { formatDate } from "../utils/helpers";

export default function ActivityList({ activities }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <List>
          {activities.slice(0, 20).map((activity) => (
            <ListItem key={activity.id} sx={{ py: 1 }}>
              <Avatar
                src={activity.userPhoto}
                sx={{ width: 32, height: 32, mr: 2 }}
              />
              <Box>
                <Typography variant="body2">
                  <strong>{activity.userName}</strong> {activity.action}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(activity.createdAt)}
                </Typography>
              </Box>
            </ListItem>
          ))}

          {activities.length === 0 && (
            <ListItem>
              <Typography color="text.secondary">No activity yet</Typography>
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
}
