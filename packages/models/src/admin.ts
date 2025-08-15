import { z } from "zod";
import { subscriptionTierSchema } from "./subscription";
import { userRoleSchema } from "./user";

// Admin user data schema
export const adminUserDataSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date(),
  roleData: z.string().nullable(),
  subscriptionData: z.string().nullable(),
});

export type AdminUserData = z.infer<typeof adminUserDataSchema>;

// System stats schema
export const systemStatsSchema = z.object({
  totalUsers: z.number(),
  premiumUsers: z.number(),
  adminUsers: z.number(),
});

export type SystemStats = z.infer<typeof systemStatsSchema>;

// Paginated users response schema
export const paginatedUsersResponseSchema = z.object({
  users: z.array(
    z.object({
      id: z.string(),
      email: z.string().email(),
      createdAt: z.date(),
      updatedAt: z.date(),
      role: userRoleSchema,
      subscriptionTier: subscriptionTierSchema,
    })
  ),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
    totalUsers: z.number(),
  }),
});

export type PaginatedUsersResponse = z.infer<
  typeof paginatedUsersResponseSchema
>;

// User details response schema
export const userDetailsResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date(),
  role: userRoleSchema,
  subscription: z.object({
    tier: subscriptionTierSchema,
    createdAt: z.date().nullable(),
    updatedAt: z.date().nullable(),
  }),
});

export type UserDetailsResponse = z.infer<typeof userDetailsResponseSchema>;
