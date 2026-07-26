import { useCallback } from 'react';
import api from '../config/api';

export const useBehaviorTracker = () => {
  const trackAction = useCallback(async (action, metadata = {}) => {
    try {
      await api.post('/recommendations/track', {
        action,
        productId: metadata.productId || null,
        categoryId: metadata.categoryId || null,
        searchQuery: metadata.searchQuery || null,
        size: metadata.size || null,
        color: metadata.color || null,
        device: metadata.device || 'DESKTOP',
      });
    } catch (err) {
      // Silent error handling for background telemetry
    }
  }, []);

  return { trackAction };
};
