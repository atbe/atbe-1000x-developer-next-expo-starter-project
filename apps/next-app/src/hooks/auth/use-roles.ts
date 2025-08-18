import type { UserRole } from '@starterp/models';
import { useAuthStore } from '~/stores/auth-store';
import {
  hasRole as hasRoleUtil,
  isAdmin as isAdminUtil,
} from '~/utils/auth-utils';

/**
 * Hook to check if the current user is an admin.
 */
export function useIsAdmin(): boolean {
  const { user } = useAuthStore();
  return isAdminUtil(user);
}

/**
 * Hook to check if the current user has a specific role.
 */
export function useHasRole(role: UserRole): boolean {
  const { user } = useAuthStore();
  return hasRoleUtil(user, role);
}

/**
 * Hook to get all roles for the current user.
 */
export function useUserRole(): UserRole {
  const { user } = useAuthStore();
  return user?.role || 'user';
}
