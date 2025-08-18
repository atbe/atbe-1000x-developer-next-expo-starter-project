import type { AppConfig, DatabaseType } from "@starterp/api";
import {
  AdminStorage,
  BillingStorageInMemory,
  BillingStoragePostgres,
  SubscriptionStoragePostgres,
  TYPES,
  UserRoleStorage,
  UserStorageInMemory,
  UserStoragePostgres,
} from "@starterp/api";
import {
  type BetterAuthConfig,
  type BillingStorageInterface,
  type JwtConfig,
  type SubscriptionStorageInterface,
  type UserStorageInterface,
} from "@starterp/models";
import { Container } from "inversify";
import "reflect-metadata";

export function createContainer({
  db,
  useLocal = false,
  stripeSecretKey = "fake_default",
  premiumMonthlyStripeProductId = "fake_default",
  jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: "7d", // Token expires in 7 days
    issuer: "starterp",
    audience: "starterp-api",
  },
  defaultAppConfig = {
    trpcServerUrl: process.env.APP_CONFIG_TRPC_SERVER_URL,
    gotrueUrl: process.env.APP_CONFIG_GOTRUE_URL,
    features: {
      autoUpdate: true,
      analytics: false,
    },
  },
  gotrueServiceRoleKey = process.env.GOTRUE_SERVICE_ROLE_KEY || "fake_default",
  betterAuthConfig = {
    secret: process.env.BETTER_AUTH_SECRET || "fake_default",
    databaseUrl: process.env.DATABASE_URL,
    baseURL: process.env.BETTER_AUTH_BASE_URL,
    trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") || [],
  },
}: {
  db: DatabaseType;
  useLocal: boolean;
  defaultAppConfig?: AppConfig;
  stripeSecretKey?: string;
  premiumMonthlyStripeProductId?: string;
  jwtConfig?: JwtConfig;
  gotrueServiceRoleKey?: string;
  betterAuthConfig?: BetterAuthConfig;
}) {
  const container = new Container({
    autobind: true,
    defaultScope: "Singleton",
  });

  if (!jwtConfig.secret) {
    throw new Error("JWT_SECRET is not set in the .env file");
  }

  container.bind<DatabaseType>(TYPES.Database).toConstantValue(db);

  container
    .bind<UserStorageInterface>(TYPES.UserStorage)
    .to(useLocal ? UserStorageInMemory : UserStoragePostgres);

  container.bind<UserRoleStorage>(TYPES.UserRoleStorage).to(UserRoleStorage);

  container.bind<AdminStorage>(TYPES.AdminStorage).to(AdminStorage);

  container
    .bind<SubscriptionStorageInterface>(TYPES.SubscriptionStorage)
    .to(SubscriptionStoragePostgres);

  container
    .bind<BillingStorageInterface>(TYPES.BillingStorage)
    .to(useLocal ? BillingStorageInMemory : BillingStoragePostgres);

  container
    .bind<AppConfig>(TYPES.DEFAULT_APP_CONFIG)
    .toConstantValue(defaultAppConfig);

  container.bind<JwtConfig>(TYPES.JWT_CONFIG).toConstantValue(jwtConfig);
  container
    .bind<string>(TYPES.GOTRUE_SERVICE_ROLE_KEY)
    .toConstantValue(gotrueServiceRoleKey);

  container
    .bind<BetterAuthConfig>(TYPES.BETTER_AUTH_CONFIG)
    .toConstantValue(betterAuthConfig);

  container
    .bind<string>(TYPES.StripeSecretKey)
    .toConstantValue(stripeSecretKey);

  container
    .bind<string>(TYPES.PremiumMonthlyStripeProductId)
    .toConstantValue(premiumMonthlyStripeProductId);

  return container;
}
