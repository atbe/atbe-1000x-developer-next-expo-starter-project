import type { BetterAuthOptions } from "better-auth";
import { v7 as uuidv7 } from "uuid";

/**
 * Custom options for Better Auth
 *
 * Docs: https://www.better-auth.com/docs/reference/options
 */
export const betterAuthOptions: BetterAuthOptions = {
  /**
   * The name of the application.
   */
  appName: "StarterP",
  /**
   * Base path for Better Auth.
   * @default "/api/auth"
   */
  basePath: "/api/auth",

  advanced: {
    database: {
      generateId(_) {
        return uuidv7();
      },
    },
  },

  socialProviders: {
    google: {
      enabled: true,
      clientId: "",
    },
  },
};
