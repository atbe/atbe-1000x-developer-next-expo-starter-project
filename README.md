# 1000x-developer

This codebase is a demonstration of the principles defined in my [*Becoming a 1000x Developer* blog
series](https://www.abeahmed.com/blog/becoming-a-1000x-developer).

**What makes this codebase special?**

When you try to use AI to iterate on this codebase, you're going to find that the AI
is just so good at implementing features. This is because of the structure.

For the best results, you should:

- Use Cursor (it will load the cursor rules which are very important to get the most out of this project). You can use another agentic editor, just be sure to transfer the rules (I will add rule files for Windsurf and Claude Code 🔜).
- Use Claude 4 Opus. It is by far, the best AI code model. OpenAI o3 is also good, but it is very slow (imho).

## Core Components

This project is a `bun` monorepo with the following core components:

- `packages/api`: The API with services defined using the repository pattern.
- `apps/http-server`: The HTTP server with tRPC endpoints. Deployable to Cloudflare Workers.
- `apps/expo-app`: The Expo app.
- `apps/next-app`: The Next.js application.
- `packages/db`: The database schema and migrations.
- `packages/db-migrations`: Migrations for the database, with tooling to apply them using Drizzle.
- `packages/models`: Data models for the app.
- `packages/tooling`: The shared tooling for the project.
- `utils/seed-data`: Tooling to seed the database.

## Running the project

To run the project, you need to have:

- `docker` (download <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer">here</a>) installed and running
- `task` (<a href="https://taskfile.dev/installation/" target="_blank" rel="noopener noreferrer">instructions here</a>)
- `bun` (download <a href="https://bun.sh/docs/installation" target="_blank" rel="noopener noreferrer">here</a>)

Once you have those dependencies installed, you can initialize the .env files with:

```bash
task initialize-env-files
```

This will copy the `.env.example` files to the correct locations (`.env`, `utils/seed-data/.env`, `packages/db/.env`, `apps/next-app/.env`, `apps/http-server/.env`).

You can start the dependencies with:

> Note (convenience): you can also use this command to destroy and start the docker containers, and apply migrations (all in one)
>
> ```
> task docker:reset
> ```

**Or**, you can start the dependencies with:

```bash
task docker:start # start the docker containers
task db:migrate # apply the migrations
```

Then, you can start the project (api, db, and next-app) with:

```bash
task start
```

You can access all services at the following URLs:

- Server: [http://localhost:3042](http://localhost:3042/health)
- tRPC: [http://localhost:3042/trpc](http://localhost:3042/trpc/hello)
- Drizzle Studio: [https://local.drizzle.studio/?port=8082](https://local.drizzle.studio/?port=8082)
- SwaggerUI: [http://localhost:8081](http://localhost:8081)
- OpenAPI HTTP server: [http://localhost:3043](http://localhost:3043/hello)
- Next.js app: [http://localhost:3000](http://localhost:3000)

> You might be wondering "why is there a SwaggerUI and an OpenAPI server?"
> 
> This is for convenience, and to demonstrate **two different transport layers**.
> You can call all of the services through plain-old HTTP client, or through tRPC (which
> is how the Next.js app calls the API).
>
> This flexibility demonstrates the power of the tRPC library and provides a useful GUI (through
> SwaggerUI) for the API.

## Logging into the app

You can login to the app by visiting [http://localhost:3000/login](http://localhost:3000/login) and using the following credentials:

- Admin: `admin@starterp.com` / `password`
- User: `user@starterp.com` / `password`

## Seeding the database

You can seed the database with:

```bash
task seed-db
```

When you run `task docker:reset`, the seeding is automatically run.

The `utils/seed-data/index.ts` file contains the script which performs the seeding.

## The Expo app

The Expo app is a mobile app built with React Native and Expo.

You can run the app with:

```bash
cd apps/expo-app
bun run start
```

This will start the app in the Expo Go app.

## Linting

You can lint **all the code** with:

```bash
task lint:fix:type-check
```

## Deployment

You can follow the instructions in the [DEPLOYMENT.md](./DEPLOYMENT.md) file.