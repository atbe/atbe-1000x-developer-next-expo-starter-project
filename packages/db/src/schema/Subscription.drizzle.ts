import { pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "../better-auth-schema/schema";

// Create an enum for subscription tiers
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium",
]);

export const SubscriptionsDatabaseSchema = pgTable("subscriptions", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: subscriptionTierEnum("tier").notNull().default("premium"), // Only store premium subscriptions
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
