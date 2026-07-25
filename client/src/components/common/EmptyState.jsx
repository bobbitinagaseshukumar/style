import React from 'react';
import Button from './Button';

const EmptyState = ({ icon: Icon, title, message, actionLabel, onAction }) => {
  return (
    <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
      {Icon && <Icon className="mx-auto h-12 w-12 text-gray-300 mb-4" />}
      <h3 className="text-lg font-medium text-gray-900 font-playfair">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{message}</p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
