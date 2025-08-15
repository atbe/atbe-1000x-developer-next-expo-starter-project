import { AuthUsers, UsersDatabaseSchema } from "@starterp/db";
import type { User, UserStorageInterface } from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "../../di/types";
import type { DatabaseType } from "../../types/database";
import { getLogger } from "../../utils/getLogger";

@injectable()
export class UserStoragePostgres implements UserStorageInterface {
  private readonly logger: Logger;

  constructor(@inject(TYPES.Database) private readonly db: DatabaseType) {
    this.logger = getLogger("UserStoragePostgres");
  }

  async createUser(user: User): Promise<User> {
    this.logger.debug("Creating user", { user });
    const result = await this.db
      .insert(UsersDatabaseSchema)
      .values(user)
      .returning();
    this.logger.debug("User created", { result });

    if (result.length === 0) {
      this.logger.error("User not created", { user });
      throw new Error("User not created");
    }

    this.logger.debug("User created", { result });

    if (!result[0]) {
      this.logger.error("User not created", { user });
      throw new Error("User not created");
    }

    const insertedUser = result[0];

    return {
      id: insertedUser.id,
      email: user.email, // Email from the input user object
      createdAt: insertedUser.createdAt,
      updatedAt: insertedUser.updatedAt,
      stripeCustomerId: insertedUser.stripeCustomerId,
    };
  }

  async getUserById(_id: string): Promise<User | null> {
    this.logger.debug("Getting user by id", { id: _id });
    const result = await this.db
      .select({
        id: UsersDatabaseSchema.id,
        email: AuthUsers.email,
        createdAt: UsersDatabaseSchema.createdAt,
        updatedAt: UsersDatabaseSchema.updatedAt,
        stripeCustomerId: UsersDatabaseSchema.stripeCustomerId,
      })
      .from(UsersDatabaseSchema)
      .innerJoin(AuthUsers, eq(UsersDatabaseSchema.id, AuthUsers.id))
      .where(eq(UsersDatabaseSchema.id, _id));

    if (result.length === 0) {
      this.logger.debug("User not found", { id: _id });
      return null;
    }

    const user = result[0];
    if (!user) {
      this.logger.debug("User not found", { id: _id });
      return null;
    }

    this.logger.debug("User found", { user });

    return {
      id: user.id,
      email: user.email || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stripeCustomerId: user.stripeCustomerId,
    };
  }

  async getUserByStripeCustomerId(
    _stripeCustomerId: string
  ): Promise<User | null> {
    this.logger.debug("Getting user by Stripe customer ID", {
      stripeCustomerId: _stripeCustomerId,
    });
    try {
      const result = await this.db
        .select()
        .from(UsersDatabaseSchema)
        .where(eq(UsersDatabaseSchema.stripeCustomerId, _stripeCustomerId));

      if (result.length === 0) {
        this.logger.debug("User not found", {
          stripeCustomerId: _stripeCustomerId,
        });
        return null;
      }

      const user = result[0];
      if (!user) {
        this.logger.debug("User not found", {
          stripeCustomerId: _stripeCustomerId,
        });
        return null;
      }

      // Get email from GoTrue users table
      const emailResult = await this.db
        .select({ email: AuthUsers.email })
        .from(AuthUsers)
        .where(eq(AuthUsers.id, user.id));

      const email = emailResult[0]?.email || "";

      this.logger.debug("User found", { user });
      return {
        id: user.id,
        email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        stripeCustomerId: user.stripeCustomerId,
      };
    } catch (error) {
      this.logger.error("Error getting user by Stripe customer ID", { error });
      throw error;
    }
  }

  async updateUser(_user: User): Promise<void> {
    this.logger.debug("Updating user", { user: _user });
    const result = await this.db
      .update(UsersDatabaseSchema)
      .set(_user)
      .where(eq(UsersDatabaseSchema.id, _user.id));
    this.logger.debug("User updated", { result });
  }

  async deleteUser(_id: string): Promise<void> {
    this.logger.debug("Deleting user", { id: _id });
    const result = await this.db
      .delete(UsersDatabaseSchema)
      .where(eq(UsersDatabaseSchema.id, _id));
    this.logger.debug("User deleted", { result });
  }

  async upsertUser(user: { id: string; email: string }): Promise<User> {
    this.logger.debug("Upserting user", { user });

    // PostgreSQL upsert using ON CONFLICT
    const result = await this.db
      .insert(UsersDatabaseSchema)
      .values({
        id: user.id,
      })
      .onConflictDoUpdate({
        target: UsersDatabaseSchema.id,
        set: {
          updatedAt: new Date(),
        },
      })
      .returning();

    if (result.length === 0) {
      this.logger.error("User not upserted", { user });
      throw new Error("User not upserted");
    }

    const upsertedUser = result[0];
    if (!upsertedUser) {
      this.logger.error("User not upserted", { user });
      throw new Error("User not upserted");
    }

    this.logger.debug("User upserted", { upsertedUser });

    return {
      id: upsertedUser.id,
      email: user.email,
      createdAt: upsertedUser.createdAt,
      updatedAt: upsertedUser.updatedAt,
      stripeCustomerId: upsertedUser.stripeCustomerId,
    };
  }
}
