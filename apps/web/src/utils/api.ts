/**
 * Get the API base URL.
 * In development, Vite proxy handles /api (use '' for relative URLs).
 * In production, use VITE_API_URL environment variable or relative URL.
 */
export function getApiUrl(): string {
  if (import.meta.env.DEV) return '';
  return import.meta.env.VITE_API_URL || '';
}

/**
 * Build full API URL from path.
 */
export function apiUrl(path: string): string {
  const baseUrl = getApiUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
}
