import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

// Async thunk: Fetch global store settings from CMS API
export const fetchStoreSettings = createAsyncThunk(
  'settings/fetchStoreSettings',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/cms/settings');
      if (data?.success && data.data) {
        return data.data;
      }
      return {};
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch settings');
    }
  }
);

// Async thunk: Fetch auth manager settings for dynamic login/registration forms
export const fetchAuthSettings = createAsyncThunk(
  'settings/fetchAuthSettings',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/settings/public');
      if (data?.success && data.data) {
        return data.data;
      }
      return {};
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch auth settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    storeSettings: {},
    authSettings: {},
    banners: [],
    homepageSections: [],
    cmsPages: [],
    faqs: [],
    loading: false,
  },
  reducers: {
    setStoreSettings: (state, action) => {
      state.storeSettings = { ...state.storeSettings, ...action.payload };
    },
    setAuthSettings: (state, action) => {
      state.authSettings = { ...state.authSettings, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStoreSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStoreSettings.fulfilled, (state, action) => {
        state.storeSettings = action.payload;
        state.loading = false;
      })
      .addCase(fetchStoreSettings.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchAuthSettings.fulfilled, (state, action) => {
        state.authSettings = action.payload;
      });
  }
});

export const { setStoreSettings, setAuthSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
