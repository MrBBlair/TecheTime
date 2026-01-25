/**
 * Get the API base URL
 * In development, uses the Vite proxy (empty string for relative URLs)
 * In production, uses VITE_API_URL environment variable or defaults to relative URL
 */
export function getApiUrl(): string {
  // In development, Vite proxy handles /api/* requests
  if (import.meta.env.DEV) {
    return '';
  }
  
  // In production, use environment variable if set, otherwise use relative URL
  // This allows deploying API separately and setting VITE_API_URL in Vercel
  return import.meta.env.VITE_API_URL || '';
}

/**
 * Build a full API URL from a path
 * @param path - API path (e.g., '/api/auth/register-business')
 * @returns Full URL or relative path depending on configuration
 */
export function apiUrl(path: string): string {
  const baseUrl = getApiUrl();
  // Remove leading slash from path if baseUrl already ends with slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
}
