import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload.notifications || [];
      state.unreadCount = action.payload.unreadCount || 0;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    markNotificationRead: (state, action) => {
      const id = action.payload;
      state.notifications = state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    markAllNotificationsRead: (state) => {
      state.notifications = state.notifications.map(n => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    },
  },
});

export const {
  setNotifications,
  setUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} = notificationSlice.actions;

export default notificationSlice.reducer;
