/**
 * Validation utilities
 */

/**
 * Validate IANA timezone string
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Try to create a date with the timezone
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
