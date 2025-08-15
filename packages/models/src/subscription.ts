import { z } from "zod";

// Subscription tier schema
export const subscriptionTierSchema = z.enum(["free", "premium"]);
export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

// Subscription schema
export const subscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tier: subscriptionTierSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;

// Create subscription input schema
export const createSubscriptionInputSchema = z.object({
  userId: z.string(),
  tier: subscriptionTierSchema,
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionInputSchema>;

// Update subscription input schema
export const updateSubscriptionInputSchema = z.object({
  tier: subscriptionTierSchema,
});

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionInputSchema>;