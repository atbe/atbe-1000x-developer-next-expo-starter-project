import { z } from "zod";
import { router } from "../base";
import { staticCachedProcedure } from "../procedures/cached.procedures";
import { adminRouter } from "./admin.router";
import { appConfigRouter } from "./app-config.router";
import { billingRouter } from "./billing.router";
import { subscriptionRouter } from "./subscription.router";
import { userRouter } from "./user.router";

export const appRouter = router({
  user: userRouter,
  subscription: subscriptionRouter,
  admin: adminRouter,
  appConfig: appConfigRouter,
  billing: billingRouter,

  hello: staticCachedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/hello",
        summary: "Hello world",
      },
      cache: {
        maxAgeInSeconds: 300, // Cache for 5 minutes on CDN
        browserMaxAgeInSeconds: 60, // Cache for 1 minute in browser
        staleWhileRevalidateInSeconds: 3600, // Serve stale for 1 hour while revalidating
        staleIfErrorInSeconds: 86400, // Serve stale for 24 hours if origin is down
        cfCacheTag: "hello-endpoint", // Cloudflare cache tag for targeted purging
      },
    })
    .input(z.undefined())
    .output(z.object({ message: z.string() }))
    .query(() => {
      return {
        message: "Hello, builder! -abe",
      };
    }),
});

export type AppRouter = typeof appRouter;
