import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const verifyOTP = createAsyncThunk('auth/verifyOTP', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'OTP verification failed');
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
  }
});

const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: storedToken,
    isAuthenticated: !!storedToken,
    loading: false,
    error: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
      }
      try {
        localStorage.removeItem('persist:auth');
        // NOTE: Do NOT clear home page product cache on login — products are public data
      } catch (e) {}
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('persist:auth');
        localStorage.removeItem('persist:cart');
        localStorage.removeItem('persist:wishlist');
        localStorage.removeItem('styleverse_cart');
        localStorage.removeItem('styleverse_wishlist');
        // NOTE: Do NOT clear home page product cache on logout — products are public data
        // NOTE: Do NOT sessionStorage.clear() — it destroys the home page SWR cache
      } catch (e) {}
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      } else {
        state.user = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data?.user;
        state.token = action.payload.data?.token;
        state.isAuthenticated = true;
        if (action.payload.data?.token) {
          localStorage.setItem('token', action.payload.data.token);
        }
        try {
          localStorage.removeItem('persist:auth');
          localStorage.removeItem('__KVLR_HOME_PERSISTENT_CACHE_V3__');
        } catch (e) {}
      })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state) => { state.loading = false; })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(verifyOTP.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data?.user;
        state.token = action.payload.data?.token;
        state.isAuthenticated = true;
        if (action.payload.data?.token) {
          localStorage.setItem('token', action.payload.data.token);
        }
        try {
          localStorage.removeItem('persist:auth');
          localStorage.removeItem('__KVLR_HOME_PERSISTENT_CACHE_V3__');
        } catch (e) {}
      })
      .addCase(verifyOTP.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload.data;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('persist:auth');
        } catch (e) {}
      });
  }
});

export const { setCredentials, logoutUser, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
