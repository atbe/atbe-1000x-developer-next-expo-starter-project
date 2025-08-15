export interface AuthService {
  /**
   * Update (or set) app_metadata for a user in the authentication provider.
   */
  updateUserMetadata(
    userId: string,
    metadata: Record<string, unknown>
  ): Promise<void>;

  /**
   * Convenience helper to set the `roles` field inside app_metadata.
   */
  setUserRoles(userId: string, roles: string[]): Promise<void>;

  /**
   * Ensure a user exists in the auth provider (idP) and return its ID.
   * If userId is provided, checks if that user exists first.
   * If not provided or user doesn't exist, creates a new user.
   * Should be idempotent.
   */
  ensureUser(
    email: string,
    password: string,
    userId?: string,
    firstName?: string,
    lastName?: string
  ): Promise<{ id: string }>;

  /**
   * Get user by email from the auth provider.
   */
  getUserByEmail(email: string): Promise<{ id: string; email: string } | null>;

  /**
   * Verify a user's password against the auth provider.
   */
  verifyPassword(email: string, password: string): Promise<boolean>;
}
