import { Logger, WorkersLogger } from "@starterp/tooling";
import type { LoggerConfig } from "../config/logger.config";

// Type for Cloudflare Workers global scope
interface WorkersGlobalScope {
  WebSocketPair?: unknown;
  __STATIC_CONTENT?: unknown;
}

// Check if we're in a Cloudflare Workers environment
const workersGlobal = globalThis as unknown as WorkersGlobalScope;
const isWorkers =
  typeof globalThis !== "undefined" &&
  (workersGlobal.WebSocketPair !== undefined ||
    workersGlobal.__STATIC_CONTENT !== undefined ||
    process.env.USE_WORKERS_DB === "true");

export const getLogger = (
  name: string,
  loggerConfig?: LoggerConfig
): Logger => {
  if (isWorkers) {
    // Use WorkersLogger for Cloudflare Workers
    return WorkersLogger.createLogger(name, {
      level: WorkersLogger.parseLogLevel(loggerConfig?.level || "info"),
    }) as unknown as Logger;
  } else {
    // Use regular Logger for other environments
    return Logger.createLogger(name, {
      level: Logger.parseLogLevel(loggerConfig?.level || "info"),
    });
  }
};
