/**
 * Robust image URL formatter that handles:
 * 1. Base64 Data URLs (data:image/...) -> returns as-is
 * 2. Absolute HTTP/HTTPS URLs -> returns with dynamic webp/compression optimization
 * 3. Local Blob URLs (blob:http...) -> returns as-is for active editing
 * 4. Relative server paths (/uploads/products/...) -> attaches backend API base URL
 */
export const formatImageUrl = (url, fallbackName = 'Product', options = {}) => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let trimmed = url.trim();
  if (!trimmed) return '';

  // 1. Data URLs and active session Blob URLs
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Cloudinary Auto-Compression (Delivers WebP/AVIF with 90% size reduction)
  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/upload/')) {
    if (!trimmed.includes('f_auto') && !trimmed.includes('q_auto')) {
      const widthOption = options.width ? `,w_${options.width}` : ',w_800';
      trimmed = trimmed.replace('/upload/', `/upload/f_auto,q_auto${widthOption}/`);
    }
  }

  // 3. Unsplash Auto-Compression & WebP
  if (trimmed.includes('images.unsplash.com')) {
    if (!trimmed.includes('auto=')) trimmed += `${trimmed.includes('?') ? '&' : '?'}auto=format&fit=crop&q=75`;
    if (options.width && !trimmed.includes('w=')) trimmed += `&w=${options.width}`;
  }

  // 4. Absolute HTTP/HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 5. Handle protocol-relative URLs (//example.com/img.jpg)
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // 6. Handle relative server paths (/uploads/...)
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

