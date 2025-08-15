import { type UserRole, type UserRoleRecord } from "@starterp/db";
import type { AuthService } from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import { inject, injectable } from "inversify";
import { TYPES } from "../../di/types";
import type { UserRoleStorage } from "../../services/user-role/user-role.storage";
import { getLogger } from "../../utils/getLogger";
import { SupabaseAuthService } from "../auth/supabase-auth.service";

@injectable()
export class UserRoleService {
  private readonly logger: Logger;

  constructor(
    @inject(TYPES.UserRoleStorage)
    private readonly userRoleStorage: UserRoleStorage,
    @inject(SupabaseAuthService)
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
    this.logger.info("Setting user role", { userId, role, actorId });
    const existingRole = await this.userRoleStorage.getUserRoleRecord(userId);

    if (existingRole) {
      if (existingRole.role === role) {
        this.logger.info("User role already set to the desired role", {
          userId,
          role,
        });
        return;
      }
      // Update existing role
      const previousRole = existingRole.role;
      this.logger.info("Updating user role", {
        userId,
        role,
        previousRole,
      });
      await this.userRoleStorage.updateUserRole(userId, role);

      // Sync all roles to auth provider
      const roleRecords = await this.userRoleStorage.getRolesForUser(userId);
      this.logger.info("Role records", { roleRecords });
      const roles = roleRecords.map((r) => r.role as string);
      await this.authService.setUserRoles(userId, roles);
      this.logger.info("Roles synced to auth provider", { roles });

      // Log the event

      await this.userRoleStorage.logSystemEvent({
        eventType: "user_role_created",
        userId,
        roleId: existingRole.id,
        properties: { previousRole, newRole: role },
        actorId: actorId || userId,
        description: this.generateEventDescription("user_role_updated", {
          previousRole,
          newRole: role,
        }),
      });
    } else {
      // Create new role record
      this.logger.info("Creating new role record", { userId, role });
      const roleId = await this.userRoleStorage.createUserRole(userId, role);
      this.logger.info("New role record created", { roleId });

      // Sync all roles
      const roleRecords = await this.userRoleStorage.getRolesForUser(userId);
      this.logger.info("Role records", { roleRecords });
      const roles = roleRecords.map((r) => r.role as string);
      await this.authService.setUserRoles(userId, roles);
      this.logger.info("Roles synced to auth provider", { roles });

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
   * Remove a given role from user (cannot remove "user")
   */
  async removeUserRole(
    userId: string,
    role: UserRole,
    actorId?: string
  ): Promise<void> {
    if (role === "user") {
      this.logger.warn("Attempt to remove protected 'user' role ignored", {
        userId,
      });
      return;
    }

    // Check existing record first
    const existingRole = await this.userRoleStorage.getUserRoleRecordByRole(
      userId,
      role
    );
    if (!existingRole) {
      this.logger.warn("Role not found for user", { userId, role });
      return;
    }

    await this.userRoleStorage.deleteUserRole(userId, role);

    // Log event
    await this.userRoleStorage.logSystemEvent({
      eventType: "user_role_removed",
      userId,
      roleId: existingRole.id,
      properties: { removedRole: role },
      actorId: actorId || userId,
      description: this.generateEventDescription("user_role_removed", {
        removedRole: role,
      }),
    });

    // Sync remaining roles
    const roleRecords = await this.userRoleStorage.getRolesForUser(userId);
    const roles = roleRecords.map((r) => r.role as string);
    await this.authService.setUserRoles(userId, roles);
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
