export const getImageUrl = (url, width, quality = 'auto') => {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${width},q_${quality}/${parts[1]}`;
    }
  }
  return url;
};
