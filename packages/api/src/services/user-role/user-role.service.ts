import { type UserRole, type UserRoleRecord } from "@starterp/db";
import type { AuthService } from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import { inject, injectable } from "inversify";
import { TYPES } from "../../di/types";
import type { UserRoleStorage } from "../../services/user-role/user-role.storage";
import { getLogger } from "../../utils/getLogger";
import { BetterAuthService } from "../auth/better-auth.service";

@injectable()
export class UserRoleService {
  private readonly logger: Logger;

  constructor(
    @inject(TYPES.UserRoleStorage)
    private readonly userRoleStorage: UserRoleStorage,
    @inject(BetterAuthService)
    private readonly authService: AuthService
  ) {
    this.logger = getLogger("UserRoleService");
  }

  /**
   * Get the role for a user.
   * Returns "user" if no role record exists (default role).
   */
  async getUserRole(userId: string): Promise<UserRole> {
    const userRole = await this.userRoleStorage.getUserRoleRecord(userId);

    // If no role record exists, user has default "user" role
    if (!userRole) {
      return "user";
    }

    return userRole.role as UserRole;
  }

  /**
   * Set the role for a user.
   * Creates or updates the role record.
   */
  async setUserRole(
    userId: string,
    role: UserRole,
    actorId?: string
  ): Promise<void> {
    // Create new role record
    this.logger.info("Creating new role record", { userId, role });
    const roleId = await this.userRoleStorage.createUserRole(userId, role);
    this.logger.info("New role record created", { roleId });

    // Log the event
    await this.userRoleStorage.logSystemEvent({
      eventType: "user_role_created",
      userId,
      roleId,
      properties: { role },
      actorId: actorId || userId,
      description: this.generateEventDescription("user_role_created", {
        role,
      }),
    });
  }

  /**
   * Check if a user has admin role
   */
  async isAdmin(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    return role === "admin";
  }

  /**
   * Get all admin users
   */
  async getAdminUsers() {
    const adminRoles = await this.userRoleStorage.getUsersByRole("admin");

    return adminRoles.map((role: UserRoleRecord) => ({
      id: role.id,
      userId: role.userId,
      role: role.role,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  }

  /**
   * Generate a human-readable description for an event
   */
  private generateEventDescription(
    eventType: string,
    properties: Record<string, any>
  ): string {
    switch (eventType) {
      case "user_role_created":
        return `User role set to ${properties.role}`;
      case "user_role_updated":
        return `User role updated from ${properties.previousRole} to ${properties.newRole}`;
      case "user_role_removed":
        return `User role ${properties.removedRole} removed`;
      default:
        return `User role event: ${eventType}`;
    }
  }
}
