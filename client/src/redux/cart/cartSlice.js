import { createSlice } from '@reduxjs/toolkit';

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

const initialState = {
  items: loadCartFromStorage(),
  appliedCoupon: null,
  discountAmount: 0,
  shippingFee: 99,
  freeShippingThreshold: 999,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { id, size, color, quantity = 1 } = action.payload;
      const existing = state.items.find(
        (item) => item.id === id && item.size === size && item.color === color
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ ...action.payload, quantity });
      }

      saveCartToStorage(state.items);
    },

    removeFromCart: (state, action) => {
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
          const matchSize = targetSize !== undefined ? item.size === targetSize : true;
          const matchColor = targetColor !== undefined ? item.color === targetColor : true;

          // If id matches and size/color match (or not specified), filter out
          return !(matchId && matchSize && matchColor);
        });
      }
      saveCartToStorage(state.items);
    },

    updateQuantity: (state, action) => {
      const { id, size, color, quantity } = action.payload;
      const item = state.items.find(
        (i) => i.id === id && i.size === size && i.color === color
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
        // Use the pre-calculated discount amount from the backend API
        state.discountAmount = Math.round(discountFixed);
      } else {
        // Fallback: calculate from percentage
        const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        state.discountAmount = Math.round((subtotal * (discountPercent || 0)) / 100);
      }
    },

    removeCoupon: (state) => {
      state.appliedCoupon = null;
      state.discountAmount = 0;
    },

    clearCart: (state) => {
      state.items = [];
      state.appliedCoupon = null;
      state.discountAmount = 0;
      localStorage.removeItem('styleverse_cart');
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
