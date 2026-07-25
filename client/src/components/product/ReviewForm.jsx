import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiStar } from 'react-icons/fi';
import Button from '../common/Button';
import Input from '../common/Input';
import { toast } from 'react-toastify';

const ReviewForm = ({ onSubmit, isLoading }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const submitForm = (data) => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    onSubmit({ ...data, rating });
    reset();
    setRating(0);
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              className="focus:outline-none"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <FiStar 
                className={`w-8 h-8 transition-colors ${
                  (hoverRating || rating) >= star ? 'text-gold-400 fill-current' : 'text-gray-300'
                }`} 
              />
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Review Title"
        placeholder="Summarize your thoughts"
        {...register('title', { required: 'Title is required' })}
        error={errors.title?.message}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
        <textarea
          rows={4}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm ${
            errors.comment ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          placeholder="Tell us what you liked or disliked..."
          {...register('comment', { 
            required: 'Review content is required',
            minLength: { value: 10, message: 'Review must be at least 10 characters' }
          })}
        />
        {errors.comment && <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>}
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
        Submit Review
      </Button>
    </form>
  );
};

export default ReviewForm;
