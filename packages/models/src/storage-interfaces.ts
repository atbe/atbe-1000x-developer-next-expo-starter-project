import { z } from "zod";
import { userSchema, type User } from "./user";
import { subscriptionSchema } from "./subscription";
import { systemEventSchema } from "./system-event";
import { billingEventSchema } from "./billing";

// User storage interface methods as schemas (for validation if needed)
export const userStorageMethodsSchema = z.object({
  createUser: z.function().args(userSchema).returns(z.promise(userSchema)),
  getUserById: z
    .function()
    .args(z.string())
    .returns(z.promise(userSchema.nullable())),
  getUserByStripeCustomerId: z
    .function()
    .args(z.string())
    .returns(z.promise(userSchema.nullable())),
  updateUser: z.function().args(userSchema).returns(z.promise(z.void())),
  deleteUser: z.function().args(z.string()).returns(z.promise(z.void())),
});

// Subscription storage interface methods
export const subscriptionStorageMethodsSchema = z.object({
  getSubscriptionByUserId: z
    .function()
    .args(z.string())
    .returns(z.promise(subscriptionSchema.nullable())),
  createSubscription: z
    .function()
    .args(subscriptionSchema.omit({ createdAt: true, updatedAt: true }))
    .returns(z.promise(subscriptionSchema)),
  updateSubscription: z
    .function()
    .args(z.string(), z.string())
    .returns(z.promise(z.void())),
  deleteSubscriptionByUserId: z
    .function()
    .args(z.string())
    .returns(z.promise(z.void())),
  createSystemEvent: z
    .function()
    .args(systemEventSchema.omit({ createdAt: true }))
    .returns(z.promise(z.void())),
});

// Billing storage interface methods
export const billingStorageMethodsSchema = z.object({
  createBillingEvent: z
    .function()
    .args(
      billingEventSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        processedAt: true,
        error: true,
      })
    )
    .returns(z.promise(billingEventSchema)),
  getBillingEventById: z
    .function()
    .args(z.string())
    .returns(z.promise(billingEventSchema.nullable())),
  getBillingEventByStripeEventId: z
    .function()
    .args(z.string())
    .returns(z.promise(billingEventSchema.nullable())),
  updateBillingEvent: z
    .function()
    .args(
      z.string(),
      billingEventSchema.partial().omit({ id: true, createdAt: true })
    )
    .returns(z.promise(billingEventSchema)),
  getBillingEventsByUserId: z
    .function()
    .args(z.string(), z.number().optional(), z.number().optional())
    .returns(z.promise(z.array(billingEventSchema))),
  getBillingEventsByCustomerId: z
    .function()
    .args(z.string(), z.number().optional(), z.number().optional())
    .returns(z.promise(z.array(billingEventSchema))),
});

// Define TypeScript interfaces from the schemas for easier implementation
export interface UserStorageInterface {
  createUser(user: User): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null>;
  updateUser(user: User): Promise<void>;
  deleteUser(id: string): Promise<void>;
  upsertUser(user: { id: string; email: string }): Promise<User>;
}

export interface SubscriptionStorageInterface {
  getSubscriptionByUserId(
    userId: string
  ): Promise<z.infer<typeof subscriptionSchema> | null>;
  createSubscription(
    subscription: Omit<
      z.infer<typeof subscriptionSchema>,
      "createdAt" | "updatedAt"
    >
  ): Promise<z.infer<typeof subscriptionSchema>>;
  updateSubscription(userId: string, tier: string): Promise<void>;
  deleteSubscriptionByUserId(userId: string): Promise<void>;
  createSystemEvent(
    event: Omit<z.infer<typeof systemEventSchema>, "createdAt">
  ): Promise<void>;
}

export interface BillingStorageInterface {
  createBillingEvent(
    event: Omit<
      z.infer<typeof billingEventSchema>,
      "id" | "createdAt" | "updatedAt" | "status" | "processedAt" | "error"
    >
  ): Promise<z.infer<typeof billingEventSchema>>;
  getBillingEventById(
    id: string
  ): Promise<z.infer<typeof billingEventSchema> | null>;
  getBillingEventByStripeEventId(
    stripeEventId: string
  ): Promise<z.infer<typeof billingEventSchema> | null>;
  updateBillingEvent(
    id: string,
    updates: Partial<
      Omit<z.infer<typeof billingEventSchema>, "id" | "createdAt">
    >
  ): Promise<z.infer<typeof billingEventSchema>>;
  getBillingEventsByUserId(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<z.infer<typeof billingEventSchema>[]>;
  getBillingEventsByCustomerId(
    customerId: string,
    limit?: number,
    offset?: number
  ): Promise<z.infer<typeof billingEventSchema>[]>;
}
