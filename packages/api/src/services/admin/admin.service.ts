import type { Logger } from "@starterp/tooling";
import { TRPCError } from "@trpc/server";
import { inject, injectable } from "inversify";
import { TYPES } from "../../di/types";
import type {
  AdminStorage,
  AdminUserData,
} from "../../services/admin/admin.storage";
import { SubscriptionService } from "../../services/subscription/subscription.service";
import { UserRoleService } from "../../services/user-role/user-role.service";
import { getLogger } from "../../utils/getLogger";

import type {
  PaginatedUsersResponse,
  UserDetailsResponse,
} from "@starterp/models";

export type { PaginatedUsersResponse, UserDetailsResponse };

@injectable()
export class AdminService {
  private readonly logger: Logger;

  constructor(
    @inject(UserRoleService)
    private readonly userRoleService: UserRoleService,
    @inject(SubscriptionService)
    private readonly subscriptionService: SubscriptionService,
    @inject(TYPES.AdminStorage) private readonly adminStorage: AdminStorage
  ) {
    this.logger = getLogger("AdminService");
  }

  /**
   * Verify that a user has admin privileges
   */
  async requireAdmin(userId: string): Promise<void> {
    const isAdmin = await this.userRoleService.isAdmin(userId);

    if (!isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }
  }

  /**
   * Get paginated users with filtering
   */
  async getUsers(
    page: number,
    pageSize: number,
    search?: string,
    tier: "all" | "free" | "premium" = "all",
    role: "all" | "user" | "admin" = "all"
  ): Promise<PaginatedUsersResponse> {
    const offset = (page - 1) * pageSize;

    // Get total count
    const totalUsers = await this.adminStorage.countUsers(search);
    const totalPages = Math.ceil(totalUsers / pageSize);

    // Get users
    const users = await this.adminStorage.getUsers(pageSize, offset, search);

    // Process and filter users
    const processedUsers = users.map((user: AdminUserData) => ({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: (user.roleData || "user") as "user" | "admin",
      subscriptionTier: (user.subscriptionData || "free") as "free" | "premium",
    }));

    // Apply tier and role filters
    const filteredUsers = processedUsers.filter((user) => {
      if (tier !== "all" && user.subscriptionTier !== tier) return false;
      if (role !== "all" && user.role !== role) return false;
      return true;
    });

    return {
      users: filteredUsers,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalUsers,
      },
    };
  }

  /**
   * Get detailed information about a specific user
   */
  async getUserDetails(userId: string): Promise<UserDetailsResponse> {
    const user = await this.adminStorage.getUserById(userId);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const role = await this.userRoleService.getUserRole(userId);
    const subscription =
      await this.subscriptionService.getUserSubscription(userId);

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role,
      subscription,
    };
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    const stats = await this.adminStorage.getSystemStats();
    const freeUsers = stats.totalUsers - stats.premiumUsers;

    return {
      totalUsers: stats.totalUsers,
      premiumUsers: stats.premiumUsers,
      freeUsers,
      adminUsers: stats.adminUsers,
    };
  }
}
