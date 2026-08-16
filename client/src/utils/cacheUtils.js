/**
 * Cache Invalidation & Realtime Content Sync Utility
 */
export const notifyContentUpdated = () => {
  try {
    localStorage.removeItem('__KVLR_HOME_PERSISTENT_CACHE_V3__');
    sessionStorage.removeItem('__KVLR_HOME_CACHE__');
    sessionStorage.removeItem('__KVLR_MEGA_CACHE__');
    window.dispatchEvent(new Event('kvlr:content-updated'));
  } catch (e) {}
};
