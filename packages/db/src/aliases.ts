import { alias } from "drizzle-orm/pg-core";
import { GoTrueUsersDatabaseSchema } from "./gotrue-schema/GoTrueUser.drizzle";

// Pre-defined aliases to avoid table name conflicts
export const AuthUsers = alias(GoTrueUsersDatabaseSchema, "auth_users");
