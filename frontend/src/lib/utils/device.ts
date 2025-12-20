/**
 * Device Detection Utilities
 *
 * Functions for detecting device type and browser information
 */

export function getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase()

  // Mobile detection
  if (/(android|webos|iphone|ipod|blackberry|iemobile|opera mini)/i.test(ua)) {
    return 'mobile'
  }

  // Tablet detection
  if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet'
  }

  return 'desktop'
}

export function getBrowserInfo(userAgent: string): string {
  const ua = userAgent

  // Detect browser
  if (ua.includes('Firefox')) {
    return 'Firefox'
  } else if (ua.includes('Chrome')) {
    return 'Chrome'
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    return 'Safari'
  } else if (ua.includes('Edge')) {
    return 'Edge'
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    return 'Opera'
  } else if (ua.includes('MSIE') || ua.includes('Trident')) {
    return 'Internet Explorer'
  }

  return 'Unknown'
}

export function getDeviceInfo(userAgent: string): string {
  const deviceType = getDeviceType(userAgent)
  const browser = getBrowserInfo(userAgent)

  return `${deviceType} - ${browser}`
}
