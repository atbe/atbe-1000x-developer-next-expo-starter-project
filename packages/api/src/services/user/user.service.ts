import type { AuthService, User, UserStorageInterface } from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import { inject, injectable } from "inversify";
import { TYPES } from "../../di/types";
import { UserRoleService } from "../../services/user-role/user-role.service";
import { getLogger } from "../../utils/getLogger";
import { BetterAuthService } from "../auth/better-auth.service";

@injectable()
export class UserService {
  private readonly logger: Logger;

  constructor(
    @inject(TYPES.UserStorage)
    private readonly userStorage: UserStorageInterface,
    @inject(UserRoleService)
    private readonly userRoleService: UserRoleService,
    @inject(BetterAuthService)
    private readonly authService: AuthService
  ) {
    this.logger = getLogger("UserService");
    this.logger.info("UserService initialized");
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.userStorage.getUserById(id);
  }

  async createUser(user: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    id?: string;
  }): Promise<User> {
    this.logger.info("Creating user profile", {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const existingUser = await this.getUserByEmail(user.email);

    if (existingUser) {
      this.logger.info("User already exists", {
        email: user.email,
        id: existingUser.id,
      });
      return existingUser;
    }

    const { id: newId } = await this.authService.ensureUser({
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      id: newId,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateUser(user: User): Promise<void> {
    return await this.userStorage.updateUser(user);
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    this.logger.info("Verifying password", { email });
    return await this.authService.verifyPassword(email, password);
  }

  async upsertUserFromOAuth(user: {
    id: string;
    email: string;
  }): Promise<User> {
    this.logger.info("Upserting user from OAuth", {
      email: user.email,
      id: user.id,
    });

    try {
      const upsertedUser = await this.userStorage.upsertUser({
        id: user.id,
        email: user.email,
      });
      this.logger.info("OAuth user upserted", { user: upsertedUser });
      return upsertedUser;
    } catch (error) {
      this.logger.error("Error upserting OAuth user", { error });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userStorage.getUserByEmail(email);
  }
}
