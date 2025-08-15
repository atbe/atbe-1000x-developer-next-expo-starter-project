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
import type {
  BillingStorageInterface,
  JwtConfig,
  SubscriptionStorageInterface,
  UserStorageInterface,
} from "@starterp/models";
import { Container } from "inversify";
import "reflect-metadata";

export function createContainer({
  db,
  useLocal = false,
  stripeSecretKey = "fake_default",
  premiumMonthlyStripeProductId = "fake_default",
  jwtConfig = {
    secret:
      process.env.JWT_SECRET ||
      "super-secret-jwt-token-with-at-least-32-characters-long",
    expiresIn: "7d", // Token expires in 7 days
    issuer: "starterp",
    audience: "starterp-api",
  },
  gotrueServiceRoleKey = process.env.GOTRUE_SERVICE_ROLE_KEY || "fake_default",
  usageCacheTimeoutMs = 60000, // Default 1 minute
}: {
  db: DatabaseType;
  useLocal: boolean;
  stripeSecretKey?: string;
  premiumMonthlyStripeProductId?: string;
  jwtConfig?: JwtConfig;
  gotrueServiceRoleKey?: string;
  usageCacheTimeoutMs?: number;
}) {
  const container = new Container({
    autobind: true,
    defaultScope: "Singleton",
  });

  container.bind<DatabaseType>(TYPES.Database).toConstantValue(db);

  container.bind<AppConfig>(TYPES.DEFAULT_APP_CONFIG).toConstantValue({
    trpcServerUrl: process.env.TRPC_SERVER_URL || "http://localhost:8787",
    gotrueUrl: process.env.GOTRUE_URL || "http://localhost:9999",
    features: {
      autoUpdate: true,
      analytics: false,
    },
  });

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

  container.bind<JwtConfig>(TYPES.JWT_CONFIG).toConstantValue(jwtConfig);
  container
    .bind<string>(TYPES.GOTRUE_SERVICE_ROLE_KEY)
    .toConstantValue(gotrueServiceRoleKey);

  container
    .bind<string>(TYPES.StripeSecretKey)
    .toConstantValue(stripeSecretKey);

  container
    .bind<string>(TYPES.PremiumMonthlyStripeProductId)
    .toConstantValue(premiumMonthlyStripeProductId);

  return container;
}
