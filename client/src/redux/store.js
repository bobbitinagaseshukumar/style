import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authReducer from './auth/authSlice';
import cartReducer from './cart/cartSlice';
import wishlistReducer from './wishlist/wishlistSlice';
import productReducer from './product/productSlice';
import categoryReducer from './category/categorySlice';
import orderReducer from './order/orderSlice';
import settingsReducer from './settings/settingsSlice';
import notificationReducer from './notification/notificationSlice';
import adminReducer from './admin/adminSlice';

const rootReducer = combineReducers({
  auth: persistReducer({ key: 'auth', storage }, authReducer),
  cart: persistReducer({ key: 'cart', storage }, cartReducer),
  wishlist: persistReducer({ key: 'wishlist', storage }, wishlistReducer),
  settings: persistReducer({ key: 'settings', storage }, settingsReducer),
  product: productReducer,
  category: categoryReducer,
  order: orderReducer,
  notification: notificationReducer,
  admin: adminReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
