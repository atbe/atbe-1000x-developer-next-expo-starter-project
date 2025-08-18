export * from "./Billing.drizzle";
export {
  SubscriptionsDatabaseSchema,
  subscriptionTierEnum,
} from "./Subscription.drizzle";
export {
  SystemEventsDatabaseSchema,
  systemEventTypeEnum,
} from "./SystemEvent.drizzle";
export {
  convertStringToUserRole,
  createUserRoleSchema,
  updateUserRoleSchema,
  userRoleEnum,
  userRoleRecordSchema,
  // Zod schemas and types
  userRoleSchema,
  UserRolesDatabaseSchema,
  type CreateUserRole,
  type UpdateUserRole,
  type UserRole,
  type UserRoleRecord,
} from "./UserRole.drizzle";

export {
  users,
  sessions,
  accounts,
  verifications,
} from "../better-auth-schema/schema";

// Make entities available on schema
