import type { User, UserStorageInterface } from "@starterp/models";
import { injectable } from "inversify";

@injectable()
export class UserStorageInMemory implements UserStorageInterface {
  private users: User[] = [];

  async createUser(user: User): Promise<User> {
    const existingUser = await this.getUserById(user.id);
    if (existingUser) {
      throw new Error("User already exists");
    }
    this.users.push(user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async getUserByStripeCustomerId(
    stripeCustomerId: string
  ): Promise<User | null> {
    return (
      this.users.find((user) => user.stripeCustomerId === stripeCustomerId) ??
      null
    );
  }

  async updateUser(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id);
  }

  async upsertUser(user: { id: string; email: string }): Promise<User> {
    const existingUser = await this.getUserById(user.id);
    if (existingUser) {
      return existingUser;
    }
    return this.createUser({
      id: user.id,
      email: user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
