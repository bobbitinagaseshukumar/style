/**
 * Robust image URL formatter that handles:
 * 1. Base64 Data URLs (data:image/...) -> returns as-is
 * 2. Absolute HTTP/HTTPS URLs -> returns as-is
 * 3. Local Blob URLs (blob:http...) -> returns as-is for active editing
 * 4. Relative server paths (/uploads/products/...) -> attaches backend API base URL
 */
export const formatImageUrl = (url, fallbackName = 'Product') => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  if (!trimmed) return '';

  // 1. Data URLs, Absolute HTTP/HTTPS URLs, and active session Blob URLs
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // 2. Handle protocol-relative URLs (//example.com/img.jpg)
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // 3. Handle relative server paths (/uploads/...)
  let backendBase = import.meta.env.VITE_API_URL || '';
  if (!backendBase && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    backendBase = 'https://style-q21b.onrender.com';
  }
  if (!backendBase) {
    backendBase = 'http://localhost:5000';
  }
  backendBase = backendBase.replace(/\/api(\/v\d+)?\/?$/, '').replace(/\/$/, '');

  return `${backendBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};
