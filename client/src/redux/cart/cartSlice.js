import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

// Safe localStorage persistence key scoped by session
const loadCartFromStorage = () => {
  try {
    const saved = localStorage.getItem('styleverse_cart');
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    return [];
  }
};

const saveCartToStorage = (items) => {
  try {
    localStorage.setItem('styleverse_cart', JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save cart:', err);
  }
};

// ==================== ASYNC THUNKS ====================

export const fetchServerCart = createAsyncThunk('cart/fetchServerCart', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/cart');
    return response.data?.data?.items || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
  }
});

export const syncServerCart = createAsyncThunk('cart/syncServerCart', async (items, { rejectWithValue }) => {
  try {
    const payloadItems = items || loadCartFromStorage();
    const response = await api.post('/cart/sync', { items: payloadItems });
    return response.data?.data?.items || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to sync cart');
  }
});

export const addToCartServer = createAsyncThunk('cart/addToCartServer', async (itemData, { dispatch }) => {
  dispatch(cartSlice.actions.addToCartLocal(itemData));
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await api.post('/cart/add', {
        productId: itemData.id,
        quantity: itemData.quantity || 1,
        size: itemData.size || '',
        color: itemData.color || '',
      });
    }
  } catch (err) {
    console.warn('[CART SYNC WARNING] Failed background add:', err.message);
  }
});

export const updateQuantityServer = createAsyncThunk('cart/updateQuantityServer', async (updateData, { dispatch }) => {
  dispatch(cartSlice.actions.updateQuantityLocal(updateData));
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await api.put('/cart/update', {
        productId: updateData.id,
        size: updateData.size || '',
        color: updateData.color || '',
        quantity: updateData.quantity,
      });
    }
  } catch (err) {
    console.warn('[CART SYNC WARNING] Failed background update:', err.message);
  }
});

export const removeFromCartServer = createAsyncThunk('cart/removeFromCartServer', async (payload, { dispatch }) => {
  dispatch(cartSlice.actions.removeFromCartLocal(payload));
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const pId = typeof payload === 'object' ? (payload.id || payload._id) : payload;
      const size = typeof payload === 'object' ? payload.size : '';
      const color = typeof payload === 'object' ? payload.color : '';
      await api.delete(`/cart/remove/by-product?productId=${pId}&size=${encodeURIComponent(size || '')}&color=${encodeURIComponent(color || '')}`);
    }
  } catch (err) {
    console.warn('[CART SYNC WARNING] Failed background remove:', err.message);
  }
});

export const clearCartServer = createAsyncThunk('cart/clearCartServer', async (_, { dispatch }) => {
  dispatch(cartSlice.actions.clearCartLocal());
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await api.delete('/cart/clear');
    }
  } catch (err) {
    console.warn('[CART SYNC WARNING] Failed background clear:', err.message);
  }
});

// ==================== SLICE ====================

const initialState = {
  items: loadCartFromStorage(),
  appliedCoupon: null,
  discountAmount: 0,
  shippingFee: 99,
  freeShippingThreshold: 999,
  loading: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems: (state, action) => {
      state.items = action.payload || [];
      saveCartToStorage(state.items);
    },

    addToCartLocal: (state, action) => {
      const { id, size, color, quantity = 1 } = action.payload;
      const existing = state.items.find(
        (item) => item.id === id && (item.size || '') === (size || '') && (item.color || '') === (color || '')
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ ...action.payload, quantity });
      }

      saveCartToStorage(state.items);
    },

    removeFromCartLocal: (state, action) => {
      const payload = action.payload;
      if (!payload) return;

      if (typeof payload === 'string' || typeof payload === 'number') {
        state.items = state.items.filter((item, idx) => item.id !== payload && item._id !== payload && idx !== payload);
      } else if (typeof payload === 'object') {
        const targetId = payload.id || payload._id;
        const targetSize = payload.size;
        const targetColor = payload.color;
        
        state.items = state.items.filter((item, idx) => {
          if (payload.index !== undefined && idx === payload.index) return false;
          
          const matchId = targetId ? (item.id === targetId || item._id === targetId) : true;
          const matchSize = targetSize !== undefined ? (item.size || '') === (targetSize || '') : true;
          const matchColor = targetColor !== undefined ? (item.color || '') === (targetColor || '') : true;

          return !(matchId && matchSize && matchColor);
        });
      }
      saveCartToStorage(state.items);
    },

    updateQuantityLocal: (state, action) => {
      const { id, size, color, quantity } = action.payload;
      const item = state.items.find(
        (i) => i.id === id && (i.size || '') === (size || '') && (i.color || '') === (color || '')
      );
      if (item && quantity > 0) {
        item.quantity = quantity;
      }
      saveCartToStorage(state.items);
    },

    applyCoupon: (state, action) => {
      const { code, discountPercent, discountFixed } = action.payload;
      state.appliedCoupon = code;
      if (discountFixed && discountFixed > 0) {
        state.discountAmount = Math.round(discountFixed);
      } else {
        const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        state.discountAmount = Math.round((subtotal * (discountPercent || 0)) / 100);
      }
    },

    removeCoupon: (state) => {
      state.appliedCoupon = null;
      state.discountAmount = 0;
    },

    clearCartLocal: (state) => {
      state.items = [];
      state.appliedCoupon = null;
      state.discountAmount = 0;
      localStorage.removeItem('styleverse_cart');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServerCart.pending, (state) => { state.loading = true; })
      .addCase(fetchServerCart.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.items = action.payload;
          saveCartToStorage(state.items);
        }
      })
      .addCase(fetchServerCart.rejected, (state) => { state.loading = false; })
      .addCase(syncServerCart.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.items = action.payload;
          saveCartToStorage(state.items);
        }
      });
  },
});

export const {
  setCartItems,
  addToCartLocal,
  removeFromCartLocal,
  updateQuantityLocal,
  applyCoupon,
  removeCoupon,
  clearCartLocal,
} = cartSlice.actions;

// Aliases matching existing component calls
export const addToCart = addToCartServer;
export const removeFromCart = removeFromCartServer;
export const updateQuantity = updateQuantityServer;
export const clearCart = clearCartServer;

export default cartSlice.reducer;
