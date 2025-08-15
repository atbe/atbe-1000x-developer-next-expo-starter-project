# Summary of `container.ts`

The `container.ts` file defines a function `createContainer` that sets up and configures an Inversify dependency injection container for the HTTP server. It binds various services, storage implementations, and configuration values (such as database, JWT, Stripe, and app config) to the container, allowing for flexible and testable service resolution throughout the application. The function supports toggling between in-memory and Postgres-backed storage for certain services, and ensures required secrets and configuration values are provided at runtime.

Configuration is injected differently when running in Cloudflare Workers vs. locally
and Inversify allows us to inject that configuration at runtime
without having to use conditional logic to determine what runtime we are in.

