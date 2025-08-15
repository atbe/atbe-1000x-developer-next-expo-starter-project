# HTTP Server Documentation

The http-server is a core backend service in the monorepo, built with TypeScript and managed using Bun. It exposes API endpoints and business logic for the platform, using tRPC for type-safe communication between the frontend and backend. The project is structured for modularity, with dependency injection, middleware, and routers organized under src/. It integrates with a Postgres database via Drizzle ORM and supports scalable, maintainable API development.

The server can be deployed to Cloudflare Workers or locally.

The `worker.ts` file is the entry point for the Cloudflare Workers deployment,
and handles the setup of the dependency injection container by utilizing the Cloudflare Worker `env` object for extracting configuration and secrets.
