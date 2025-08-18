import { z } from "zod";

export const betterAuthConfigSchema = z.object({
  databaseUrl: z.string(),
  baseURL: z.string(),
  secret: z.string(),

  trustedOrigins: z.array(z.string()),
});

export type BetterAuthConfig = z.infer<typeof betterAuthConfigSchema>;
