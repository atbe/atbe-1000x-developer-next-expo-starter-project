export const TYPES = {
  Database: Symbol("Database"),
  UserStorage: Symbol("UserStorage"),
  UserRoleStorage: Symbol("UserRoleStorage"),
  AdminStorage: Symbol("AdminStorage"),
  BillingStorage: Symbol("BillingStorage"),
  SubscriptionStorage: Symbol("SubscriptionStorage"),

  // Auth
  AuthService: Symbol("AuthService"),
  BetterAuthService: Symbol("BetterAuthService"),

  // Stripe
  StripeSecretKey: Symbol("StripeSecretKey"),
  PremiumMonthlyStripeProductId: Symbol("PremiumMonthlyStripeProductId"),

  // App Config
  DEFAULT_APP_CONFIG: Symbol("DEFAULT_APP_CONFIG"),

  // Logger
  LOGGER_CONFIG: Symbol("LOGGER_CONFIG"),

  // Better Auth
  BETTER_AUTH_CONFIG: Symbol("BETTER_AUTH_CONFIG"),
};
