import { getLogger } from "@starterp/api";
import http from "http";
import "reflect-metadata";
import type { OpenApiRouter } from "trpc-to-openapi";
import {
  createOpenApiHttpHandler,
  generateOpenApiDocument,
} from "trpc-to-openapi";
import { createContainer } from "./di/container";
import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/routers/app.router";
import { getDatabase } from "./utils/database";

const logger = getLogger("main");

if (!process.env.STRIPE_SECRET_KEY) {
  logger.error("STRIPE_SECRET_KEY environment variable is required");
  process.exit(1);
}

if (!process.env.PREMIUM_MONTHLY_STRIPE_PRODUCT_ID) {
  logger.error(
    "PREMIUM_MONTHLY_STRIPE_PRODUCT_ID environment variable is required"
  );
  process.exit(1);
}

logger.info("Initializing database");
const db = await getDatabase({
  databaseUrl: process.env.DATABASE_URL,
});
logger.info("Database initialized");

const container = createContainer({
  db,
  useLocal: process.env.USE_LOCAL_STORAGE === "true",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY as string,
  premiumMonthlyStripeProductId: process.env
    .PREMIUM_MONTHLY_STRIPE_PRODUCT_ID as string,
});
logger.info("Container initialized");

const openApiServerPort = process.env.OPENAPI_SERVER_PORT || 3043;
const openApi = generateOpenApiDocument(appRouter as OpenApiRouter, {
  title: "1000x Developer API",
  description: "API for the 1000x Developer platform",
  version: "1.0.0",
  baseUrl: `http://localhost:${openApiServerPort}`,
  docsUrl: "/docs",
  tags: ["user"],
});

const openApiServer = http.createServer(async (req, res) => {
  try {
    // Log incoming request
    logger.info(`Incoming request: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      headers: req.headers,
    });

    // Set CORS headers for all requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      logger.info("Handling OPTIONS preflight request");
      res.writeHead(200);
      res.end();
      return;
    }

    // Handle openapi.json request first
    if (req.url === "/openapi.json") {
      logger.info("Serving OpenAPI spec");
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(openApi));
      return;
    }

    // Pass other requests to the OpenAPI handler
    logger.info("Creating OpenAPI handler");
    const handler = createOpenApiHttpHandler({
      router: appRouter as OpenApiRouter,
      createContext: (opts) => {
        try {
          logger.info("Creating context for request", {
            path: opts.req.url,
            method: opts.req.method,
          });
          
          // Create a mock Hono context for OpenAPI server
          // Store response headers that will be set
          const responseHeaders: Record<string, string> = {};
          
          const mockHonoContext = {
            req: {
              header: (name: string) => {
                const value = opts.req.headers[name.toLowerCase()];
                logger.debug(`Getting request header ${name}: ${value}`);
                return value;
              },
            },
            // Add header method for setting response headers
            header: (name: string, value: string) => {
              logger.debug(`Setting response header ${name}: ${value}`);
              responseHeaders[name] = value;
              // Actually set the header on the response
              if (opts.res) {
                opts.res.setHeader(name, value);
              }
            },
          } as any;

          const context = createContext(mockHonoContext, container);
          logger.info("Context created successfully");
          return context;
        } catch (error) {
          logger.error("Error creating context:", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          throw error;
        }
      },
      onError: ({ error, type, path, input }) => {
        logger.error("tRPC error occurred:", {
          error: error.message,
          code: error.code,
          type,
          path,
          input,
          stack: error.stack,
        });
      },
      responseMeta() {
        return {
          headers: {
            "Content-Type": "application/json",
          },
        };
      },
    });
    
    logger.info("Handling request with OpenAPI handler");
    handler(req, res);
  } catch (error) {
    logger.error("Fatal error in OpenAPI server:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Send error response
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }));
  }
});

openApiServer.listen(openApiServerPort, () => {
  logger.info(
    `OpenAPI server is running at http://localhost:${openApiServerPort}`
  );
  logger.info(
    `OpenAPI docs are available at http://localhost:${openApiServerPort}/openapi.json`
  );

  logger.info(`Swagger UI is available at http://localhost:8083`);
});
