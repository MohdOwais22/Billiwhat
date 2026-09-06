/**
 * Application Branding Configuration
 * Single Source of Truth for the application brand name.
 */

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'WhatsBill';

/**
 * Returns the configured application brand name.
 */
export function getBrandName(): string {
  return APP_NAME;
}

/**
 * Helper to get brand initials (e.g., "WhatsBill" -> "WB", "Hisab" -> "HI")
 */
export function getBrandInitials(name: string = APP_NAME): string {
  if (!name) return 'WB';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  const camelMatches = name.match(/[A-Z]/g);
  if (camelMatches && camelMatches.length >= 2) {
    return (camelMatches[0] + camelMatches[1]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
