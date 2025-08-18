export interface AuthService {
  /**
   * Convenience helper to set the `roles` field inside app_metadata.
   */
  setUserRole(userId: string, role: string): Promise<void>;

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
   * Verify a user's password against the auth provider.
   */
  verifyPassword(email: string, password: string): Promise<boolean>;
}
