import { useSelector, useDispatch } from 'react-redux';
import { addToCart, updateCartItem, removeFromCart, clearCart, selectCartTotal, selectCartCount } from '../redux/cart/cartSlice';

export const useCart = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.cart);
  const total = useSelector(selectCartTotal);
  const count = useSelector(selectCartCount);

  return {
    items,
    loading,
    total,
    count,
    addItem: (item) => dispatch(addToCart(item)),
    updateItem: (item) => dispatch(updateCartItem(item)),
    removeItem: (id) => dispatch(removeFromCart(id)),
    clear: () => dispatch(clearCart()),
  };
};
