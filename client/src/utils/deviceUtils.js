/**
 * Client device detector helper
 * Parses navigator userAgent to return accurate human-friendly device names and categories
 */
export const getClientDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      deviceName: 'Web Browser',
      deviceType: 'desktop',
      os: 'Unknown',
      browser: 'Web Browser',
    };
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const platform = (window.navigator.platform || '').toLowerCase();

  let os = 'Unknown OS';
  let deviceType = 'desktop'; // 'mobile' | 'tablet' | 'desktop'
  let friendlyName = 'Desktop PC';

  if (ua.includes('android') || platform.includes('armv') || platform.includes('linux arm')) {
    os = 'Android';
    deviceType = 'mobile';
    if (ua.includes('samsung')) friendlyName = 'Samsung Galaxy (Android)';
    else if (ua.includes('pixel')) friendlyName = 'Google Pixel (Android)';
    else if (ua.includes('oneplus')) friendlyName = 'OnePlus Phone (Android)';
    else if (ua.includes('redmi') || ua.includes('xiaomi')) friendlyName = 'Xiaomi / Redmi (Android)';
    else if (ua.includes('vivo')) friendlyName = 'Vivo Smartphone (Android)';
    else if (ua.includes('oppo')) friendlyName = 'Oppo Smartphone (Android)';
    else friendlyName = 'Android Smartphone';
  } else if (ua.includes('iphone')) {
    os = 'iOS';
    deviceType = 'mobile';
    friendlyName = 'Apple iPhone';
  } else if (ua.includes('ipad')) {
    os = 'iPadOS';
    deviceType = 'tablet';
    friendlyName = 'Apple iPad';
  } else if (ua.includes('windows phone')) {
    os = 'Windows Phone';
    deviceType = 'mobile';
    friendlyName = 'Windows Mobile';
  } else if (ua.includes('windows nt 10.0') || ua.includes('windows 10') || ua.includes('windows 11') || platform.includes('win')) {
    os = 'Windows 11 / 10';
    deviceType = 'desktop';
    friendlyName = 'Windows PC / Laptop';
  } else if (ua.includes('macintosh') || ua.includes('mac os x') || platform.includes('mac')) {
    os = 'macOS';
    deviceType = 'desktop';
    friendlyName = 'Apple Mac / MacBook';
  } else if (ua.includes('linux')) {
    os = 'Linux';
    deviceType = 'desktop';
    friendlyName = 'Linux Workstation';
  }

  let browser = 'Web Browser';
  if (ua.includes('edg/') || ua.includes('edge/')) {
    browser = 'Microsoft Edge';
  } else if (ua.includes('chrome/') || ua.includes('crios/')) {
    browser = deviceType === 'mobile' ? 'Chrome Mobile' : 'Google Chrome';
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    browser = deviceType === 'mobile' ? 'Mobile Safari' : 'Apple Safari';
  } else if (ua.includes('firefox/') || ua.includes('fxios/')) {
    browser = 'Mozilla Firefox';
  } else if (ua.includes('opera') || ua.includes('opr/')) {
    browser = 'Opera';
  }

  const deviceName = `${friendlyName} (${browser})`;
  const fingerprint = `dev_${os.replace(/[^a-zA-Z0-9]/g, '')}_${browser.replace(/[^a-zA-Z0-9]/g, '')}_${screen.width}x${screen.height}`;

  return {
    deviceName,
    deviceType,
    os,
    browser,
    fingerprint,
  };
};
