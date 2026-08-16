/**
 * Cache Invalidation & Realtime Content Sync Utility
 * Prevents 1-second stale data flashes across page navigation
 */

export const clearAppStaleCache = () => {
  try {
    if (typeof window !== 'undefined') {
      const keysToRemoveLocal = [];
      const keysToRemoveSession = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('CACHE') || k.includes('KVLR'))) keysToRemoveLocal.push(k);
      }
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && (k.includes('CACHE') || k.includes('KVLR'))) keysToRemoveSession.push(k);
      }
      keysToRemoveLocal.forEach(k => localStorage.removeItem(k));
      keysToRemoveSession.forEach(k => sessionStorage.removeItem(k));
    }
  } catch (e) {}
};

export const notifyContentUpdated = () => {
  try {
    clearAppStaleCache();
    window.dispatchEvent(new Event('kvlr:content-updated'));
  } catch (e) {}
};
