import { createSlice } from '@reduxjs/toolkit';

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
  reducers: {}
});

export default settingsSlice.reducer;
