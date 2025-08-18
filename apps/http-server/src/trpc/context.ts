import {
  AdminService,
  AppConfigService,
  BetterAuthService,
  BillingService,
  getLogger,
  SubscriptionService,
  UserRoleService,
  UserService,
} from "@starterp/api";
import type { JWTPayload } from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import type { Context as HonoContext } from "hono";
import type { Container } from "inversify";

/**
 * Base context available to all procedures
 * @property {App} app - The application instance with all services
 * @property {HonoContext} c - The Hono context
 */
export type Context = {
  c: HonoContext;
  logger: Logger;

  adminService: AdminService;
  betterAuthService: BetterAuthService;
  userService: UserService;
  userRoleService: UserRoleService;
  subscriptionService: SubscriptionService;
  billingService: BillingService;
  appConfigService: AppConfigService;
};

/**
 * Context for authenticated procedures
 * Extends base context with user information
 */
export type AuthenticatedContext = Context & {
  user: JWTPayload;
};

/**
 * Creates a tRPC context with the app instance and Hono context
 * @param app - The application instance
 * @param c - The Hono context
 * @returns The tRPC context
 */
export function createContext(c: HonoContext, container: Container): Context {
  const adminService = container.get(AdminService);
  const betterAuthService = container.get(BetterAuthService);
  const userService = container.get(UserService);
  const userRoleService = container.get(UserRoleService);
  const subscriptionService = container.get(SubscriptionService);
  const billingService = container.get(BillingService);
  const appConfigService = container.get(AppConfigService);

  return {
    c,
    logger: getLogger("TRPCContext"),

    adminService,
    betterAuthService,
    userService,
    userRoleService,
    subscriptionService,
    billingService,
    appConfigService,
  };
}
