// Central utility for instant 0ms Recently Viewed Product tracking across tabs & sessions

const RECENTLY_VIEWED_KEY = '__KVLR_RECENTLY_VIEWED_LIST__';

export const getLocalRecentlyViewed = () => {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

export const saveToRecentlyViewed = (product) => {
  if (!product || (!product.id && !product._id)) return;
  try {
    const targetId = product.id || product._id;
    const existing = getLocalRecentlyViewed();
    const filtered = existing.filter(p => (p.id || p._id) !== targetId);
    const updated = [product, ...filtered].slice(0, 20);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('kvlr:recently-viewed-updated'));
  } catch (e) {}
};

export const clearLocalRecentlyViewed = () => {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
    window.dispatchEvent(new Event('kvlr:recently-viewed-updated'));
  } catch (e) {}
};
