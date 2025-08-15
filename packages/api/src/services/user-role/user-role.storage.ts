import {
  convertStringToUserRole,
  SystemEventsDatabaseSchema,
  UserRolesDatabaseSchema,
  type UserRole,
  type UserRoleRecord,
} from "@starterp/db";
import type { RoleEventData } from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import { eq, and } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "../../di/types";
import type { DatabaseType } from "../../types/database";
import { getLogger } from "../../utils/getLogger";
import { v4 as uuidv4 } from "uuid";

@injectable()
export class UserRoleStorage {
  private readonly logger: Logger;

  constructor(@inject(TYPES.Database) private readonly db: DatabaseType) {
    this.logger = getLogger("UserRoleStorage");
  }

  /**
   * Get role record for a user
   */
  async getUserRoleRecord(userId: string): Promise<UserRoleRecord | null> {
    const [userRole] = await this.db
      .select()
      .from(UserRolesDatabaseSchema)
      .where(eq(UserRolesDatabaseSchema.userId, userId))
      .limit(1);

    return userRole || null;
  }

  /**
   * Get role record for a user by role
   */
  async getUserRoleRecordByRole(
    userId: string,
    role: UserRole
  ): Promise<UserRoleRecord | null> {
    const [rec] = await this.db
      .select()
      .from(UserRolesDatabaseSchema)
      .where(
        and(
          eq(UserRolesDatabaseSchema.userId, userId),
          eq(UserRolesDatabaseSchema.role, role)
        )
      )
      .limit(1);
    return rec || null;
  }

  /**
   * Create a new role record
   */
  async createUserRole(userId: string, role: UserRole): Promise<string> {
    const roleId = uuidv4();
    const convertedRole = convertStringToUserRole(role);

    await this.db.insert(UserRolesDatabaseSchema).values({
      id: roleId,
      userId,
      role: convertedRole,
    });

    return roleId;
  }

  /**
   * Update an existing role record
   */
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const convertedRole = convertStringToUserRole(role);

    await this.db
      .update(UserRolesDatabaseSchema)
      .set({
        role: convertedRole,
        updatedAt: new Date(),
      })
      .where(eq(UserRolesDatabaseSchema.userId, userId));
  }

  /**
   * Delete a specific role record for a user (except "user").
   */
  async deleteUserRole(userId: string, role: UserRole): Promise<void> {
    await this.db
      .delete(UserRolesDatabaseSchema)
      .where(
        and(
          eq(UserRolesDatabaseSchema.userId, userId),
          eq(UserRolesDatabaseSchema.role, role)
        )
      );
  }

  /**
   * Get all users with a specific role
   */
  async getUsersByRole(role: UserRole): Promise<UserRoleRecord[]> {
    return await this.db
      .select()
      .from(UserRolesDatabaseSchema)
      .where(eq(UserRolesDatabaseSchema.role, role));
  }

  /**
   * Get all role records for a single user (supports multi-role users)
   */
  async getRolesForUser(userId: string): Promise<UserRoleRecord[]> {
    return await this.db
      .select()
      .from(UserRolesDatabaseSchema)
      .where(eq(UserRolesDatabaseSchema.userId, userId));
  }

  /**
   * Log a system event
   */
  async logSystemEvent(eventData: RoleEventData): Promise<void> {
    await this.db.insert(SystemEventsDatabaseSchema).values({
      id: uuidv4(),
      eventType: eventData.eventType as any,
      userId: eventData.userId,
      actorId: eventData.actorId,
      entityId: eventData.roleId,
      entityType: "user_role",
      properties: eventData.properties as any,
      description: eventData.description,
    });
  }
}
