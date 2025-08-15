import type { Logger } from "@starterp/tooling";
import { inject, injectable } from "inversify";
import { TYPES } from "../di/types";
import { getLogger } from "../utils/getLogger";
import { z } from "zod";

export const AppConfigSchema = z.object({
  /**
   * This is the URL of the TRPC server.
   *
   * In production, this is the URL of the Cloudflare worker.
   * In development, this is the URL of the local TRPC server (http://localhost:8787).
   */
  trpcServerUrl: z.string().optional(),

  /**
   * This is the URL of the GoTrue server.
   *
   * In production, this is the URL of the Cloudflare worker.
   * In development, this is the URL of the local GoTrue server (http://localhost:9999).
   */
  gotrueUrl: z.string().optional(),

  /**
   * This is a record of feature flags.
   *
   * In production, this is the URL of the Cloudflare worker.
   * In development, this is the URL of the local GoTrue server (http://localhost:9999).
   */
  features: z.record(z.boolean()).optional(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

@injectable()
export class AppConfigService {
  private readonly logger: Logger;
  constructor(
    @inject(TYPES.DEFAULT_APP_CONFIG) private readonly defaultConfig: AppConfig
  ) {
    this.logger = getLogger("AppConfigService");
    this.logger.info("AppConfigService initialized");
  }

  async getConfig(): Promise<AppConfig> {
    this.logger.info("Getting app config", {
      defaultConfig: this.defaultConfig,
    });
    try {
      // For now, return default config
      // TODO: Implement database storage for app config
      return this.defaultConfig;
    } catch (error) {
      this.logger.error("Error fetching app config:", { error });
      return this.defaultConfig;
    }
  }
}
