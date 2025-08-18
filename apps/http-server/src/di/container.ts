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
  defaultAppConfig = {
    trpcServerUrl: process.env.APP_CONFIG_TRPC_SERVER_URL,
    gotrueUrl: process.env.APP_CONFIG_GOTRUE_URL,
    features: {
      autoUpdate: true,
      analytics: false,
    },
  },
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
