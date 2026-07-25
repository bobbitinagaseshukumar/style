import React from 'react';
import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';

const CartItem = ({ item, onUpdate, onRemove }) => {
  return (
    <div className="flex py-6 border-b border-gray-200">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
        <Link to={`/product/${item.product}`}>
          <img
            src={item.image || 'https://via.placeholder.com/150'}
            alt={item.name}
            className="h-full w-full object-cover object-center hover:scale-105 transition-transform"
          />
        </Link>
      </div>

      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3><Link to={`/product/${item.product}`}>{item.name}</Link></h3>
            <p className="ml-4">{formatCurrency(item.price * item.quantity)}</p>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {item.color && <span className="mr-2">Color: <span className="capitalize">{item.color}</span></span>}
            {item.size && <span>Size: {item.size}</span>}
          </p>
        </div>
        <div className="flex flex-1 items-end justify-between text-sm">
          <div className="flex items-center border border-gray-300 rounded">
            <button 
              type="button"
              onClick={() => onUpdate({ id: item.id, quantity: Math.max(1, item.quantity - 1) })}
              className="p-1 px-2 text-gray-500 hover:text-gold-500 disabled:opacity-50"
              disabled={item.quantity <= 1}
            >
              <FiMinus className="w-3 h-3" />
            </button>
            <span className="px-2 font-medium w-8 text-center">{item.quantity}</span>
            <button 
              type="button"
              onClick={() => onUpdate({ id: item.id, quantity: Math.min(item.stock || 10, item.quantity + 1) })}
              className="p-1 px-2 text-gray-500 hover:text-gold-500 disabled:opacity-50"
              disabled={item.quantity >= (item.stock || 10)}
            >
              <FiPlus className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="font-medium text-red-500 hover:text-red-700 flex items-center"
          >
            <FiTrash2 className="w-4 h-4 mr-1" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
