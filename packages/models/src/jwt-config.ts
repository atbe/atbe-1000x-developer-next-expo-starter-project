import { z } from "zod";

export const jwtConfigSchema = z.object({
  secret: z.string().optional(),
  expiresIn: z.string(),
  issuer: z.string(),
  audience: z.string(),
});

export type JwtConfig = z.infer<typeof jwtConfigSchema>;
