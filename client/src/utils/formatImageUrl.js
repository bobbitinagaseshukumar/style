/**
 * Robust image URL formatter that handles:
 * 1. Base64 Data URLs (data:image/...) -> returns as-is
 * 2. Absolute HTTP/HTTPS URLs -> returns as-is
 * 3. Relative server paths (/uploads/products/...) -> attaches backend API base URL
 * 4. Local browser blob: URLs or broken/empty URLs -> returns high quality fashion image fallback
 */
export const formatImageUrl = (url, fallbackName = 'Product') => {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1542272604-780c36856d67?w=800';
  }

  const trimmed = url.trim();

  // 1. Data URLs & Absolute HTTP/HTTPS URLs
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 2. Reject temporary local browser blob: URLs (cannot be loaded across tabs/devices)
  if (trimmed.startsWith('blob:')) {
    return 'https://images.unsplash.com/photo-1542272604-780c36856d67?w=800';
  }

  // 3. Handle relative server paths (/uploads/...)
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api(\/v\d+)?\/?$/, '');
  return `${backendBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};
