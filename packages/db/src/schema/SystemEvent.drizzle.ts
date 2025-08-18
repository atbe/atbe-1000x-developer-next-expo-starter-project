import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "../better-auth-schema/schema";

// Create an enum for system event types
export const systemEventTypeEnum = pgEnum("system_event_type", [
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "user_role_created",
  "user_role_updated",
  "user_created",
  "user_updated",
  "user_deleted",
]);

export const SystemEventsDatabaseSchema = pgTable("system_events", {
  id: uuid("id").primaryKey(),
  eventType: systemEventTypeEnum("event_type").notNull(),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  actorId: text("actor_id"), // Removed foreign key - can be any identifier (user ID, "stripe", "system", etc.)
  entityId: text("entity_id"), // ID of the entity being acted upon (e.g., subscription ID)
  entityType: text("entity_type"), // Type of entity (e.g., "subscription", "user", "user_role")
  properties: jsonb("properties").notNull().default({}), // Additional event-specific data
  description: text("description"), // Human-readable description of the event
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
