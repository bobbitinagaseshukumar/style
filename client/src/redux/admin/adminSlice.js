import { createSlice } from '@reduxjs/toolkit';

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    dashboardStats: {},
    users: [],
    activityLogs: [],
    loading: false,
  },
  reducers: {}
});

export default adminSlice.reducer;
