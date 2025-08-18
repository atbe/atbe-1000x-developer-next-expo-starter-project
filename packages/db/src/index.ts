import * as schema from "./schema";

export { schema };

export * from "./schema";

export {
  authSchema,
  GoTrueUsersDatabaseSchema,
} from "./gotrue-schema/GoTrueUser.drizzle";

// Export pre-defined aliases
export { AuthUsers } from "./aliases";
export { appSchema } from "./schema/AppSchema.drizzle";

export { users as UsersDatabaseSchema } from "./better-auth-schema/schema";
