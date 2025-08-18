import type { Logger } from "@starterp/tooling";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer } from "better-auth/plugins";
import type { DatabaseType } from "../types/database";
import { betterAuthOptions } from "./options";

/**
 * Better Auth Instance
 */
export const auth = (
  config: {
    databaseUrl: string;
    baseURL: string;
    secret: string;
    trustedOrigins: string[];
    schema: any;
    db?: DatabaseType;

    plugins?: any[];
  },
  logger?: Logger
) => {
  return betterAuth({
    ...betterAuthOptions,
    database: drizzleAdapter(config.db ?? {}, {
      provider: "pg",
      schema: config.schema,
      usePlural: true,
    }),
    baseURL: config.baseURL,
    secret: config.secret,

    user: {
      additionalFields: {
        stripeCustomerId: {
          type: "string",
          required: false,
        },
      },
    },

    plugins: [admin(), bearer()],

    // Additional options that depend on env ...

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendVerificationEmail: async ({ user, url }: { user: any; url: any }) => {
        logger?.info("Email verification requested", {
          email: user.email,
          url,
        });
      },
      sendResetPassword: async ({ user, url }) => {
        logger?.info("Password reset requested", {
          email: user.email,
          url,
        });
      },
    },

    socialProviders: process.env.GOOGLE_CLIENT_ID
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},

    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },

    trustedOrigins: config.trustedOrigins,
  });
};
