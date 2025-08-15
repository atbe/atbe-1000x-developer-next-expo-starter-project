import { z } from "zod";
import { userRoleSchema } from "./user";

// JWT payload schema
export const jwtPayloadSchema = z.object({
  id: z.string(), // user id (same as sub)
  sub: z.string(), // user id
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  roles: z.array(userRoleSchema).default([]),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type JWTPayload = z.infer<typeof jwtPayloadSchema>;

// Login request schema
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

// Login response schema
export const loginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    name: z.string().optional(),
    roles: z.array(userRoleSchema).default([]),
  }),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

// Token refresh response schema
export const tokenRefreshResponseSchema = z.object({
  token: z.string(),
});

export type TokenRefreshResponse = z.infer<typeof tokenRefreshResponseSchema>;
