import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useAuth } from '~/hooks/use-auth';

interface AuthLinkProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  href: string;
  requireAuth?: boolean;
  loginPath?: string;
}

/**
 * A Link component that automatically handles authentication redirects
 * If the user is not authenticated and requireAuth is true, it will redirect to login
 * with the intended destination preserved as a redirect parameter
 */
export function AuthLink({
  href,
  requireAuth = true,
  loginPath = '/login',
  children,
  ...props
}: AuthLinkProps) {
  const { isAuthenticated } = useAuth();

  // If authentication is required and user is not authenticated,
  // create a link to login with redirect parameter
  const linkHref =
    requireAuth && !isAuthenticated
      ? `${loginPath}?redirect=${encodeURIComponent(href)}`
      : href;

  return (
    <Link href={linkHref} {...props}>
      {children}
    </Link>
  );
}
