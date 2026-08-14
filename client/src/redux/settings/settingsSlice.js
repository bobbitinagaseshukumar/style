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

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    storeSettings: {},
    banners: [],
    homepageSections: [],
    cmsPages: [],
    faqs: [],
    loading: false,
  },
  reducers: {
    setStoreSettings: (state, action) => {
      state.storeSettings = { ...state.storeSettings, ...action.payload };
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
      });
  }
});

export const { setStoreSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
