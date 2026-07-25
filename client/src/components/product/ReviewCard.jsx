import React from 'react';
import { FiCheckCircle, FiStar } from 'react-icons/fi';
import { formatDate } from '../../utils/formatDate';

const ReviewCard = ({ review }) => {
  return (
    <div className="border-b border-gray-100 py-6 last:border-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-bold text-lg">
            {review.user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-medium text-charcoal-900 flex items-center gap-2">
              {review.user?.name || 'Anonymous User'}
              {review.isVerified && <FiCheckCircle className="text-green-500 w-4 h-4" title="Verified Purchase" />}
            </p>
            <p className="text-xs text-gray-500">{formatDate(review.createdAt || new Date())}</p>
          </div>
        </div>
        <div className="flex text-gold-400">
          {[...Array(5)].map((_, i) => (
            <FiStar key={i} className={i < review.rating ? "fill-current" : "text-gray-300"} />
          ))}
        </div>
      </div>
      {review.title && <h4 className="font-medium text-charcoal-900 mb-2">{review.title}</h4>}
      <p className="text-gray-600 text-sm">{review.comment}</p>
    </div>
  );
};

export default ReviewCard;
