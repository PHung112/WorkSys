import http from "./axiosConfig";

const notificationApi = {
  getMyNotifications: () => http.get("/api/notifications"),
  getUnreadCount: () => http.get("/api/notifications/unread-count"),
  markAsRead: (id) => http.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => http.put("/api/notifications/read-all"),
  acceptInvite: (id) => http.post(`/api/notifications/${id}/accept`),
  declineInvite: (id) => http.post(`/api/notifications/${id}/decline`),
};

export default notificationApi;
