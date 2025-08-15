import { useRouter } from 'next/router';
import { useCallback } from 'react';

/**
 * Custom hook for handling redirect URLs in authentication flows
 */
export function useRedirect() {
  const router = useRouter();
  
  // Get the redirect URL from query parameters
  const redirectUrl = router.query.redirect as string;
  
  /**
   * Navigate to the redirect URL or a default destination
   * @param defaultPath - The default path to navigate to if no redirect URL exists
   */
  const navigateToRedirect = useCallback((defaultPath = '/dashboard') => {
    const destination = redirectUrl || defaultPath;
    router.push(destination);
  }, [redirectUrl, router]);
  
  /**
   * Create a URL with redirect parameter preserved
   * @param path - The path to navigate to
   * @param currentPath - Optional current path to use as redirect (defaults to current route)
   */
  const createRedirectUrl = useCallback((path: string, currentPath?: string) => {
    const redirect = currentPath || router.asPath;
    return `${path}?redirect=${encodeURIComponent(redirect)}`;
  }, [router.asPath]);
  
  /**
   * Preserve redirect parameter when navigating between auth pages
   * @param path - The path to navigate to (e.g., '/login' or '/signup')
   */
  const preserveRedirect = useCallback((path: string) => {
    if (redirectUrl) {
      return `${path}?redirect=${encodeURIComponent(redirectUrl)}`;
    }
    return path;
  }, [redirectUrl]);
  
  return {
    redirectUrl,
    navigateToRedirect,
    createRedirectUrl,
    preserveRedirect,
  };
}