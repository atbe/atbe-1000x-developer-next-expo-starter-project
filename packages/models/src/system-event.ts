import { z } from "zod";

// System event schema
export const systemEventSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  userId: z.string(),
  actorId: z.string(),
  entityId: z.string(),
  entityType: z.string(),
  properties: z.record(z.unknown()),
  description: z.string(),
  createdAt: z.date(),
});

export type SystemEvent = z.infer<typeof systemEventSchema>;

// Create system event input schema
export const createSystemEventInputSchema = systemEventSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateSystemEventInput = z.infer<
  typeof createSystemEventInputSchema
>;

// Event type enum (common event types)
export const eventTypeSchema = z.enum([
  "user.created",
  "user.updated",
  "user.deleted",
  "subscription.created",
  "subscription.updated",
  "subscription.cancelled",
  "role.assigned",
  "role.removed",
]);

export type EventType = z.infer<typeof eventTypeSchema>;

// Entity type enum
export const entityTypeSchema = z.enum(["user", "subscription", "role"]);

export type EntityType = z.infer<typeof entityTypeSchema>;

// Role event data schema
export const roleEventDataSchema = z.object({
  eventType: z.enum(["user_role_created", "user_role_removed"]),
  userId: z.string(),
  roleId: z.string(),
  properties: z.record(z.unknown()),
  actorId: z.string(),
  description: z.string(),
});

export type RoleEventData = z.infer<typeof roleEventDataSchema>;
