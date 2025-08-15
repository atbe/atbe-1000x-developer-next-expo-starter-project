import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { appSchema } from "./AppSchema.drizzle";

export const UsersDatabaseSchema = appSchema.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
