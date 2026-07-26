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
      const { id, size, color } = action.payload;
      state.items = state.items.filter(
        (item) => !(item.id === id && item.size === size && item.color === color)
      );
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
