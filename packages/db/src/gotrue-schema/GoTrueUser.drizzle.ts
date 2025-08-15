// This file defines the GoTrueUsersDatabaseSchema for type-safety and query building only.
// It is NOT intended to be managed by Drizzle migrations.
// To ensure Drizzle does NOT generate migrations for this table, do NOT import this file in your migration entrypoint or migration generation scripts.

import {
  pgSchema,
  text,
  uuid,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// Only use this schema for type-safety and query building, NOT for migration generation.
export const authSchema = pgSchema("auth");

export const GoTrueUsersDatabaseSchema = authSchema.table("users", {
  instanceId: uuid("instance_id").notNull(),
  id: uuid("id").primaryKey().notNull(),

  aud: text("aud").notNull(),
  role: text("role").notNull(),
  email: text("email").notNull().unique(),
  encryptedPassword: text("encrypted_password").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  invitedAt: timestamp("invited_at"),

  confirmationToken: text("confirmation_token"),
  confirmationSentAt: timestamp("confirmation_sent_at"),

  recoveryToken: text("recovery_token"),
  recoverySentAt: timestamp("recovery_sent_at"),

  emailChangeToken: text("email_change_token"),
  emailChange: text("email_change"),
  emailChangeSentAt: timestamp("email_change_sent_at"),

  lastSignInAt: timestamp("last_sign_in_at"),

  rawAppMetaData: jsonb("raw_app_meta_data"),
  rawUserMetaData: jsonb("raw_user_meta_data"),

  isSuperAdmin: boolean("is_super_admin").notNull().default(false),

  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
