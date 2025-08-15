import { useAuthStore } from "../../stores/auth-store";
import {
  isAdmin as isAdminUtil,
  hasRole as hasRoleUtil,
} from "../../utils/auth-utils";
import type { UserRole } from "@starterp/models";

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
export function useUserRoles(): UserRole[] {
  const { user } = useAuthStore();
  return user?.roles || [];
}
