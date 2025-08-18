import { z } from "zod";

// User schema (slim profile table - FK to auth.users.id)
export const userSchema = z.object({
  id: z.string(), // FK to auth.users.id
  stripeCustomerId: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
});

export type User = z.infer<typeof userSchema>;

// User role schema
export const userRoleSchema = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

// User with role schema (for frontend/API responses)
export const userWithRoleSchema = userSchema.extend({
  roles: z.array(userRoleSchema).default([]),
});

export type UserWithRole = z.infer<typeof userWithRoleSchema>;

// Frontend user schema (minimal user data for client-side state)
export const frontendUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  name: z.string().optional(),
  roles: z.array(userRoleSchema).default([]),
});

export type FrontendUser = z.infer<typeof frontendUserSchema>;

export const userInfoSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  expires_at: z.number(),
  refresh_token: z.string(),
  provider_token: z.string().optional(),
  user: z.object({
    id: z.string(),
    aud: z.string(),
    role: z.string(),
    email: z.string().email(),
    email_confirmed_at: z.string().nullable().optional(),
    phone: z.string(),
    confirmed_at: z.string().nullable().optional(),
    last_sign_in_at: z.string().nullable().optional(),
    app_metadata: z.object({
      provider: z.string(),
      providers: z.array(z.string()),
      roles: z.array(z.string()),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      full_name: z.string().optional(),
    }),
    user_metadata: z.object({
      avatar_url: z.string().url().optional(),
      email: z.string().email().optional(),
      email_verified: z.boolean().optional(),
      full_name: z.string().optional(),
      iss: z.string().optional(),
      name: z.string().optional(),
      phone_verified: z.boolean().optional(),
      picture: z.string().url().optional(),
      provider_id: z.string().optional(),
      sub: z.string().optional(),
    }),
    identities: z.array(
      z.object({
        identity_id: z.string(),
        id: z.string(),
        user_id: z.string(),
        identity_data: z.object({
          email: z.string().email().optional(),
          email_verified: z.boolean().optional(),
          phone_verified: z.boolean().optional(),
          sub: z.string().optional(),
          avatar_url: z.string().url().optional(),
          full_name: z.string().optional(),
          iss: z.string().optional(),
          name: z.string().optional(),
          picture: z.string().url().optional(),
          provider_id: z.string().optional(),
        }),
        provider: z.string(),
        last_sign_in_at: z.string().nullable().optional(),
        created_at: z.string().nullable().optional(),
        updated_at: z.string().nullable().optional(),
        email: z.string().email().optional(),
      })
    ),
    created_at: z.string(),
    updated_at: z.string(),
    is_anonymous: z.boolean().optional(),
  }),
});

export type UserInfo = z.infer<typeof userInfoSchema>;

// Create user input schema (for profile creation)
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Update user input schema (for profile updates)
export const updateUserInputSchema = z.object({
  stripeCustomerId: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
