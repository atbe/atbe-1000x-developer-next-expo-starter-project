import type { AuthService, User, UserStorageInterface } from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import { inject, injectable } from "inversify";
import { v4 as uuidv4 } from "uuid";
import { TYPES } from "../../di/types";
import { UserRoleService } from "../../services/user-role/user-role.service";
import { getLogger } from "../../utils/getLogger";
import { SupabaseAuthService } from "../auth/supabase-auth.service";

@injectable()
export class UserService {
  private readonly logger: Logger;

  constructor(
    @inject(TYPES.UserStorage)
    private readonly userStorage: UserStorageInterface,
    @inject(UserRoleService)
    private readonly userRoleService: UserRoleService,
    @inject(SupabaseAuthService)
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
    const newId = user.id ?? uuidv4();
    this.logger.info("Creating user profile", {
      email: user.email,
      id: newId,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // Ensure underlying auth provider user exists (creates if missing)
    const { id: authId } = await this.authService.ensureUser(
      user.email,
      user.password,
      newId, // Pass the ID if we have it, undefined otherwise
      user.firstName,
      user.lastName
    );
    if (authId !== newId) {
      this.logger.error("Auth ID mismatch", { authId, newId });
      throw new Error("Auth ID mismatch");
    }

    await this.authService.updateUserMetadata(authId, {
      full_name: `${user.firstName} ${user.lastName}`,
      name: `${user.firstName} ${user.lastName}`,
    });

    try {
      this.logger.info("Inserting into storage", {
        email: user.email,
        id: newId,
      });
      const newUser = await this.userStorage.createUser({
        id: newId,
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      this.logger.info("User profile created", { user: newUser });
      return newUser;
    } catch (error) {
      this.logger.error("Error creating user profile", { error });
      throw error;
    }
  }

  async updateUser(user: User): Promise<void> {
    return await this.userStorage.updateUser(user);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    this.logger.info("Getting user by email", { email });

    // Get user from auth provider (now uses efficient database query)
    const authUser = await this.authService.getUserByEmail(email);
    if (!authUser) {
      this.logger.debug("User not found in auth provider", { email });
      return null;
    }

    // Get user profile from our database
    const user = await this.userStorage.getUserById(authUser.id);
    if (!user) {
      this.logger.debug("User profile not found in database", {
        email,
        authId: authUser.id,
      });
      return null;
    }

    return user;
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
}
