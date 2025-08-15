import { AppConfigSchema } from "@starterp/api";
import { z } from "zod";
import { publicProcedure, router } from "../base";

export const appConfigRouter = router({
  getConfig: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/app-config",
        summary: "Get app configuration",
        description: "Get the current app configuration",
        tags: ["app-config"],
        protect: false,
        successDescription: "Configuration fetched successfully",
      },
    })
    .input(z.undefined())
    .output(AppConfigSchema)
    .query(async ({ ctx }) => {
      const config = await ctx.appConfigService.getConfig();
      ctx.logger?.info("App config fetched", { config });
      return config;
    }),
});
