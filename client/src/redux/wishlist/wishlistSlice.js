import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

const loadWishlistFromStorage = () => {
  try {
    const saved = localStorage.getItem('styleverse_wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    return [];
  }
};

const saveWishlistToStorage = (items) => {
  try {
    localStorage.setItem('styleverse_wishlist', JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save wishlist:', err);
  }
};

// ==================== ASYNC THUNKS ====================

export const fetchServerWishlist = createAsyncThunk('wishlist/fetchServerWishlist', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/wishlist');
    return response.data?.data?.items || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
  }
});

export const addToWishlistServer = createAsyncThunk('wishlist/addToWishlistServer', async (product, { dispatch }) => {
  dispatch(wishlistSlice.actions.addToWishlistLocal(product));
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await api.post('/wishlist/add', { productId: product.id });
    }
  } catch (err) {
    console.warn('[WISHLIST SYNC WARNING] Failed background add:', err.message);
  }
});

export const removeFromWishlistServer = createAsyncThunk('wishlist/removeFromWishlistServer', async (productId, { dispatch }) => {
  dispatch(wishlistSlice.actions.removeFromWishlistLocal(productId));
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await api.delete(`/wishlist/remove/by-product?productId=${productId}`);
    }
  } catch (err) {
    console.warn('[WISHLIST SYNC WARNING] Failed background remove:', err.message);
  }
});

// ==================== SLICE ====================

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: loadWishlistFromStorage(),
    loading: false,
  },
  reducers: {
    addToWishlistLocal: (state, action) => {
      if (!state.items.find(item => item.id === action.payload.id)) {
        state.items.push(action.payload);
        saveWishlistToStorage(state.items);
      }
    },
    removeFromWishlistLocal: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      saveWishlistToStorage(state.items);
    },
    clearWishlist: (state) => {
      state.items = [];
      localStorage.removeItem('styleverse_wishlist');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServerWishlist.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.items = action.payload;
          saveWishlistToStorage(state.items);
        }
      });
  }
});

export const { addToWishlistLocal, removeFromWishlistLocal, clearWishlist } = wishlistSlice.actions;

export const addToWishlist = addToWishlistServer;
export const removeFromWishlist = removeFromWishlistServer;

export default wishlistSlice.reducer;
