import { timestamp, uuid } from "drizzle-orm/pg-core";
import { appSchema } from "./AppSchema.drizzle";
import { UsersDatabaseSchema } from "./User.drizzle";

// Create an enum for subscription tiers
export const subscriptionTierEnum = appSchema.enum("subscription_tier", [
  "free",
  "premium",
]);

export const SubscriptionsDatabaseSchema = appSchema.table("subscriptions", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => UsersDatabaseSchema.id, { onDelete: "cascade" }),
  tier: subscriptionTierEnum("tier").notNull().default("premium"), // Only store premium subscriptions
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
