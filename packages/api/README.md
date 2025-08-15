# @starterp/api

This package contains the API server built with Hono and tRPC.

## Features

- **Hono Server**: Fast, lightweight web framework
- **tRPC Integration**: Type-safe API routes
- **Service Architecture**: Clean separation of concerns with services
- **Dependency Injection**: Services and storage implementations are wired
  together using [Inversify](https://inversify.io)
- **Context Passing**: The `App` instance, which resolves dependencies from the
  container, is available in all tRPC procedures

## Structure

```bash
src/
├── app.ts              # Main App class that holds all services
├── server.ts           # Hono server setup with tRPC
├── index.ts            # Package exports
├── services/           # Business logic services
│   └── user/          # User service example
└── trpc/              # tRPC configuration
    ├── context.ts      # tRPC context with app instance
    ├── trpc.ts         # tRPC instance setup
    └── routers/        # tRPC routers
        ├── app.router.ts   # Main router
        └── user.router.ts  # User routes
```

## API Endpoints

- **Health Check**: `GET /health`
- **tRPC Endpoint**: `/trpc/*`

## tRPC Routes

All tRPC procedures have access to the app instance through the context, allowing them to use any service registered in the App class.

## Adding New Services

1. Create a new service in `src/services/`
2. Bind the service and any required storage classes in `src/di/container.ts`
3. Create a new tRPC router in `src/trpc/routers/`
4. Add the router to the main `appRouter` in `app.router.ts`

## Type Safety

The tRPC integration provides full type safety between the server and client. Export the `AppRouter` type to use in your frontend:

```typescript
import type { AppRouter } from "@starterp/api";
```

### Dependency Injection

The Inversify container in `src/di/container.ts` binds the database connection,
storage implementations and services. The container is passed to the `App`
constructor so that each service receives its dependencies automatically. You
can toggle between the Postgres and in-memory storage by adjusting the bindings
in the container.
