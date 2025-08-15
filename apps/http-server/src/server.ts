import { trpcServer } from "@hono/trpc-server";
import { BillingService, getLogger } from "@starterp/api";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Container } from "inversify";
import Stripe from "stripe";
import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/routers/app.router";

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-06-30.basil",
    })
  : null;

export function createServer(container: Container) {
  const server = new Hono();
  const serverLogger = getLogger("Server");

  server.onError((err, c) => {
    serverLogger.error("Error in server", { error: err });
    return c.json({ error: "Internal server error" }, 500) as Response;
  });

  server.use("/*", cors());

  server.get("/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Stripe webhook endpoint - MUST be before tRPC to handle raw body
  const billingService = container.get(BillingService);
  server.post("/stripe/webhook", async (c) => {
    serverLogger.info("Stripe webhook received");
    if (!stripe) {
      return c.json({ error: "Stripe not configured" }, 500);
    }

    const signature = c.req.header("stripe-signature");
    serverLogger.info("Stripe webhook signature", { signature });
    if (!signature) {
      return c.json({ error: "Missing stripe-signature header" }, 400);
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    serverLogger.info("Stripe webhook secret", { webhookSecret });
    if (!webhookSecret) {
      serverLogger.error("STRIPE_WEBHOOK_SECRET not configured");
      return c.json({ error: "Webhook secret not configured" }, 500);
    }

    try {
      // Get raw body for signature verification
      const rawBody = await c.req.text();

      serverLogger.info("Stripe webhook received", {
        bodyLength: rawBody.length,
        signature: `${signature.substring(0, 20)}...`,
      });

      // Verify webhook signature (use async version for Bun/Node.js)
      const event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret
      );

      serverLogger.info("Stripe webhook verified", {
        type: event.type,
        id: event.id,
      });

      // Process the event
      try {
        await billingService.processWebhookEvent(event);
        serverLogger.info("Webhook event processed successfully", {
          eventId: event.id,
          eventType: event.type,
        });
      } catch (processingError) {
        serverLogger.error("Failed to process webhook event", {
          error: processingError,
          eventId: event.id,
          eventType: event.type,
        });
        throw processingError;
      }

      return c.json({ received: true });
    } catch (err) {
      if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
        serverLogger.error("Invalid webhook signature", { error: err.message });
        return c.json({ error: "Invalid signature" }, 400);
      }

      serverLogger.error("Error processing webhook:", { error: err });
      return c.json({ error: "Webhook processing failed" }, 500);
    }
  });

  server.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext: (_opts, c) => createContext(c, container),
    })
  );

  return server;
}

export type Server = ReturnType<typeof createServer>;
