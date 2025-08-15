import {
  AuthUsers,
  GoTrueUsersDatabaseSchema,
  SubscriptionsDatabaseSchema,
  UserRolesDatabaseSchema,
  UsersDatabaseSchema,
} from "@starterp/db";
import type { Logger } from "@starterp/tooling";
import { eq, like, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "../../di/types";
import type { DatabaseType } from "../../types/database";
import { getLogger } from "../../utils/getLogger";

import type { AdminUserData, SystemStats, User } from "@starterp/models";

export type { AdminUserData, SystemStats };

@injectable()
export class AdminStorage {
  private readonly logger: Logger;

  constructor(@inject(TYPES.Database) private readonly db: DatabaseType) {
    this.logger = getLogger("AdminStorage");
  }

  /**
   * Count users with optional search filter
   */
  async countUsers(search?: string): Promise<number> {
    if (search) {
      // Count with search - join with GoTrue users table
      const result = await this.db.execute(
        sql`SELECT count(*) FROM app.users 
            LEFT JOIN auth.users ON app.users.id = auth.users.id 
            WHERE auth.users.email ILIKE ${`%${search}%`}`
      );

      return Number((result as any)[0]?.count || 0);
    } else {
      // Count all users - no join needed
      const result = await this.db.execute(sql`SELECT count(*) FROM app.users`);

      return Number((result as any)[0]?.count || 0);
    }
  }

  /**
   * Get paginated users with optional search
   */
  async getUsers(
    limit: number,
    offset: number,
    search?: string
  ): Promise<AdminUserData[]> {
    const initialQuery = this.db
      .select({
        id: UsersDatabaseSchema.id,
        createdAt: UsersDatabaseSchema.createdAt,
        email: sql<string>`coalesce(${AuthUsers.email}, '')`,
        updatedAt: UsersDatabaseSchema.updatedAt,
        roleData: UserRolesDatabaseSchema.role,
        subscriptionData: SubscriptionsDatabaseSchema.tier,
      })
      .from(UsersDatabaseSchema)
      .leftJoin(AuthUsers, eq(UsersDatabaseSchema.id, AuthUsers.id))
      .leftJoin(
        UserRolesDatabaseSchema,
        eq(UsersDatabaseSchema.id, UserRolesDatabaseSchema.userId)
      )
      .leftJoin(
        SubscriptionsDatabaseSchema,
        eq(UsersDatabaseSchema.id, SubscriptionsDatabaseSchema.userId)
      );

    if (search) {
      return await initialQuery.where(like(AuthUsers.email, `%${search}%`));
    }

    return await initialQuery
      .limit(limit)
      .offset(offset)
      .orderBy(UsersDatabaseSchema.createdAt);
  }

  /**
   * Get a single user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const results = await this.db
      .select({
        id: UsersDatabaseSchema.id,
        email: sql<string>`coalesce(${GoTrueUsersDatabaseSchema.email}, '')`,
        createdAt: UsersDatabaseSchema.createdAt,
        updatedAt: UsersDatabaseSchema.updatedAt,
        stripeCustomerId: UsersDatabaseSchema.stripeCustomerId,
      })
      .from(UsersDatabaseSchema)
      .leftJoin(
        GoTrueUsersDatabaseSchema,
        eq(UsersDatabaseSchema.id, GoTrueUsersDatabaseSchema.id)
      )
      .where(eq(UsersDatabaseSchema.id, userId))
      .limit(1);

    if (results.length > 0) {
      return results[0] || null;
    }
    return null;
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    // Get total users
    const totalUsersResult = await this.db
      .select({ count: sql`count(*)` })
      .from(UsersDatabaseSchema);

    // Get premium users
    const premiumUsersResult = await this.db
      .select({ count: sql`count(*)` })
      .from(SubscriptionsDatabaseSchema)
      .where(eq(SubscriptionsDatabaseSchema.tier as any, "premium"));

    // Get admin users
    const adminUsersResult = await this.db
      .select({ count: sql`count(*)` })
      .from(UserRolesDatabaseSchema)
      .where(eq(UserRolesDatabaseSchema.role as any, "admin"));

    return {
      totalUsers: Number(totalUsersResult[0]?.count || 0),
      premiumUsers: Number(premiumUsersResult[0]?.count || 0),
      adminUsers: Number(adminUsersResult[0]?.count || 0),
    };
  }
}
