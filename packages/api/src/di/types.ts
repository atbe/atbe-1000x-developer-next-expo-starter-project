export const TYPES = {
  Database: Symbol("Database"),
  UserStorage: Symbol("UserStorage"),
  UserRoleStorage: Symbol("UserRoleStorage"),
  AdminStorage: Symbol("AdminStorage"),
  BillingStorage: Symbol("BillingStorage"),
  SubscriptionStorage: Symbol("SubscriptionStorage"),

  // Stripe
  StripeSecretKey: Symbol("StripeSecretKey"),
  PremiumMonthlyStripeProductId: Symbol("PremiumMonthlyStripeProductId"),

  // App Config
  DEFAULT_APP_CONFIG: Symbol("DEFAULT_APP_CONFIG"),

  // Logger
  LOGGER_CONFIG: Symbol("LOGGER_CONFIG"),

  // JWT
  JWT_CONFIG: Symbol("JWT_CONFIG"),
  GOTRUE_SERVICE_ROLE_KEY: Symbol("GOTRUE_SERVICE_ROLE_KEY"),
};
