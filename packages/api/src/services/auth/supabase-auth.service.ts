// Using the GoTrue SDK instead of direct HTTP calls for better safety and reliability

import type { AuthService } from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import { GoTrueClient } from "@supabase/gotrue-js";
import { inject, injectable } from "inversify";
import { TYPES } from "../../di/types";
import type { DatabaseType } from "../../types/database";
import { getLogger } from "../../utils/getLogger";

/**
 * SupabaseAuthService communicates with the GoTrue authentication service.
 * Since we're using standalone GoTrue (not full Supabase), we use the GoTrue SDK.
 *
 * We use the service-role key to access admin endpoints for user management.
 */
@injectable()
export class SupabaseAuthService implements AuthService {
  private readonly logger: Logger;
  private readonly goTrueClient: GoTrueClient;

  constructor(
    @inject(TYPES.GOTRUE_SERVICE_ROLE_KEY)
    private readonly serviceRoleKey: string,
    @inject(TYPES.Database) private readonly db: DatabaseType
  ) {
    this.logger = getLogger("SupabaseAuthService");

    const apiUrl = process.env.GOTRUE_URL || "http://localhost:9999";

    if (!this.serviceRoleKey) {
      this.logger.warn(
        "GOTRUE_SERVICE_ROLE_KEY is not set – AuthService will operate in a noop mode"
      );
    }

    this.goTrueClient = new GoTrueClient({
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      autoRefreshToken: false,
      persistSession: false,
    });
  }

  async updateUserMetadata(
    userId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    if (!process.env.GOTRUE_SERVICE_ROLE_KEY) {
      this.logger.warn(
        "Skipping auth metadata sync – no valid service role JWT"
      );
      return;
    }

    try {
      const { error } = await this.goTrueClient.admin.updateUserById(userId, {
        app_metadata: metadata,
      });

      if (error) {
        throw error;
      }

      this.logger.debug("Updated auth metadata", { userId, metadata });
    } catch (error) {
      this.logger.error("Failed to update auth metadata", { error, userId });
      throw error;
    }
  }

  async setUserRole(userId: string, role: string): Promise<void> {
    await this.updateUserMetadata(userId, { role });
  }

  /**
   * Ensure a user exists in the auth provider (idP) and return its ID.
   * If userId is provided, checks if that user exists first.
   * If not provided or user doesn't exist, creates a new user.
   * Should be idempotent.
   */
  async ensureUser(
    email: string,
    password: string,
    userId?: string,
    firstName?: string,
    lastName?: string
  ): Promise<{ id: string }> {
    if (!process.env.GOTRUE_SERVICE_ROLE_KEY) {
      throw new Error("GOTRUE_SERVICE_ROLE_KEY not set");
    }

    try {
      // If we have a userId, check if that user exists
      if (userId) {
        this.logger.info("Checking if user exists", { userId });
        try {
          const { data: user, error } =
            await this.goTrueClient.admin.getUserById(userId);
          if (!error && user) {
            // User exists, return their ID
            return { id: user.user.id };
          }
        } catch (error) {
          this.logger.error("Failed to get user by ID", { error, userId });
          // Continue to create user if not found
        }
      }

      // User doesn't exist or no ID provided, create them
      try {
        this.logger.info("Creating user", { email, userId });
        const response = await this.goTrueClient.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm the email
          id: userId,
          app_metadata: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          },
        });

        this.logger.debug("Create user response", { response });

        if (response.error) {
          throw response.error;
        }

        // The response structure might be different - let's check both data and user
        const user = response.data?.user || response.data;

        if (!user?.id) {
          this.logger.error("User creation response missing user data", {
            response,
          });
          throw new Error("User creation succeeded but no user data returned");
        }

        return { id: user.id };
      } catch (createError: any) {
        // If user already exists error, we should already have the user ID
        if (
          createError.message?.includes("already exists") ||
          createError.code === "email_exists"
        ) {
          this.logger.warn("User already exists", {
            email,
            error: createError.message,
          });
          // Since we're using UUIDs and controlling user creation,
          // this should only happen if the user was already created
          // with the same email. The caller should handle this case.
        }

        throw createError;
      }
    } catch (error) {
      this.logger.error("Failed to ensure user", { error, email, userId });
      throw error;
    }
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      // Use the regular (non-admin) client to verify password
      const { data, error } = await this.goTrueClient.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If the error is about invalid credentials, return false
        if (error.message?.includes("Invalid login credentials")) {
          return false;
        }
        throw error;
      }

      // If we got here, the password is valid
      return !!data.user;
    } catch (error) {
      this.logger.error("Failed to verify password", { error, email });
      // For security, we return false instead of throwing on password verification errors
      return false;
    }
  }
}
