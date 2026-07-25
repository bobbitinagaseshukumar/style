import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

const Error404 = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-playfair font-bold text-gold-500 mb-4">404</h1>
      <h2 className="text-3xl font-medium text-charcoal-900 mb-6">Page Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        We can't seem to find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/">
        <Button size="lg">Return to Homepage</Button>
      </Link>
    </div>
  );
};

export default Error404;
