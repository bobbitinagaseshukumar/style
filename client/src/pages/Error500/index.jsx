import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

const Error500 = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-playfair font-bold text-red-500 mb-4">500</h1>
      <h2 className="text-3xl font-medium text-charcoal-900 mb-6">Internal Server Error</h2>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Something went wrong on our end. Please try again later.
      </p>
      <button onClick={() => window.location.reload()} className="mb-4 text-gold-600 hover:underline">
        Refresh Page
      </button>
      <Link to="/">
        <Button size="lg" variant="outline">Return to Homepage</Button>
      </Link>
    </div>
  );
};

export default Error500;
