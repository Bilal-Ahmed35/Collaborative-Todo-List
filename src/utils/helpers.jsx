// Utility functions for display and formatting
export const getPriorityColor = (priority) => {
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

export const getStatusColor = (status) => {
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

export const getMemberName = (uid, members) => {
  const member = members.find((m) => m.uid === uid);
  return member ? member.displayName || member.email : "Unknown";
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export const isOverdue = (deadline) => {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
};
