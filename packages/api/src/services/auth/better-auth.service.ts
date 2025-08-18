import { schema } from "@starterp/db";
import { type AuthService, type BetterAuthConfig } from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import { inject, injectable } from "inversify";
import { auth } from "../../auth/better-auth";
import { TYPES } from "../../di/types";
import type { DatabaseType } from "../../types/database";
import { getLogger } from "../../utils/getLogger";

@injectable()
export class BetterAuthService implements AuthService {
  private readonly logger: Logger;
  public readonly auth;

  constructor(
    @inject(TYPES.Database) private readonly db: DatabaseType,
    @inject(TYPES.BETTER_AUTH_CONFIG) private readonly config: BetterAuthConfig
  ) {
    this.logger = getLogger("BetterAuthService");

    this.logger.info("BetterAuthConfig", { config: this.config });

    this.auth = auth({
      databaseUrl: this.config.databaseUrl,
      baseURL: this.config.baseURL,
      secret: this.config.secret,
      trustedOrigins: this.config.trustedOrigins,
      schema,
      db: this.db,
    });

    this.logger.info("BetterAuthService initialized");
  }

  getAuth() {
    return this.auth;
  }

  async ensureUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<{ id: string }> {
    try {
      const name =
        firstName && lastName ? `${firstName} ${lastName}` : undefined;

      const response = await this.auth.api.signUpEmail({
        body: {
          email,
          password,
          name: name?.trim() || "",
        },
      });

      if (!response.user) {
        throw new Error("User creation failed");
      }

      this.logger.info("User created successfully", {
        email,
        userId: response.user.id,
      });

      return { id: response.user.id };
    } catch (error) {
      this.logger.error("Failed to ensure user", { error, email });
      throw error;
    }
  }

  async setUserRole(userId: string, role: string): Promise<void> {
    await this.auth.api.setRole({
      body: {
        userId,
        role: role as "user" | "admin" | ("user" | "admin")[],
      },
      headers: {
        Authorization: `Bearer ${this.config.secret}`,
      },
    });
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      const response = await this.auth.api.signInEmail({
        body: { email, password },
      });

      return !!response.user;
    } catch (error: unknown) {
      this.logger.warn("Password verification failed", { email, error });
      return false;
    }
  }
}
