# Deployment Instructions

By the end of this guide, you will have:

- A deployed Neon Postgres database
- A deployed GoTrue auth server
- A deployed API on Cloudflare Workers
- A deployed Next app on Vercel
- The app working end-to-end where you can login and logout, and access the admin dashboard

## Step 1. Secrets Setup

1. Start by creating a new `.secrets.prod` file in the root of the project.
    ```env
    DATABASE_URL=postgresql://postgres:YOUR_NEON_PASSWORD@YOUR-NEON-PROJECT-ID-pooler.c-2.us-east-2.aws.neon.tech/app?sslmode=require&channel_binding=require

    GOTRUE_JWT_SECRET=SOME_RANDOM_STRING_HERE
    JWT_SECRET=SOME_RANDOM_STRING_HERE

    # generate this with the `task gotrue:service-key` command
    GOTRUE_SERVICE_ROLE_KEY=YOUR_GOTRUE_SERVICE_ROLE_KEY_HERE

    STRIPE_WEBHOOK_SECRET="test"
    STRIPE_SECRET_KEY="test"
    ```
2. Generate a random string for the `GOTRUE_JWT_SECRET` and `JWT_SECRET` with the `openssl rand -hex 32` command and update the `.secrets.prod` file with the new string.
3. Generate a service role key for the gotrue server using the new JWT secret with the `task gotrue:service-key` command and update the `.secrets.prod` file with the new key

We'll update the postgres server URL and password in step 2 (Database Deployment).

## Step 2. Database Deployment

The recommended database provider to use is [Neon](https://neon.tech/).

Neon has native support for Postgres over websockets, which works with Cloudflare Workers. You can also use [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/) to connect to a Supabase/RDS/other Postgres database.

### Neon Setup

1. Create a new Neon project, choose Postgres version 17 (note the region that you deploy this project in, we'll want to deploy our GoTrue server in the same region so the latency is low)
2. Click "Connect" and note down two URLs:
   - Keep the "Connection Pooling" checkbox checked -- copy the Postgres server URL from the connection string, which will look like `ep-misty-resonance-aednsjdc-pooler.c-2.us-east-2.aws.neon.tech` -- **this is the Pooled URL**
   - Uncheck the "Connection Pooling" checkbox, then copy the Postgres server URL, which will look like `@ep-misty-resonance-aednsjdc-pooler.c-2.us-east-2.aws.neon.tech` (notice there's no `-pooler` suffix) -- **this is the Non-Pooled URL**
3. Create a new database named `app` by navigating to the "Overview" tab, clicking "Roles & Databases", and then clicking "Add database" -- make sure the name is `app`
4. While on the "Roles & Databases" tab, create a new role named `postgres` -- **copy the password**
5. Update the `.secrets.prod` file with the new password from the previous step
6. Update the `.secrets.prod` file with the **Pooled URL**
7. Click the "SQL Editor" button on the sidebar and run the following commands:
    ```sql
    CREATE SCHEMA if not exists app;
    CREATE SCHEMA if not exists auth;
    ALTER USER postgres SET search_path TO auth,app,public;
    ```
8. Run the migrations against the neon database by running `task db-migrations:apply-migrations-prod` -- the output will look like this:
   ```bash
    task: [db-migrations:apply-migrations-prod] pwd && bun run drizzle-kit migrate
    /Users/ibrahimahmed/code/1000x-developer/packages/db-migrations
    $ drizzle-kit migrate
    No config path provided, using default 'drizzle.config.ts'
    Reading config file '/Users/ibrahimahmed/code/1000x-developer/packages/db-migrations/drizzle.config.ts'
    databaseUrl VALUE_OF_DATABASE_URL_IN_SECRETS_PROD_FILE
    Using 'pg' driver for database querying
    [✓] migrations applied successfully!%    
    ```

If you see the above output, the migrations were applied successfully 🥳

Your database is now deployed and ready to be used.

## Step 3. Gotrue Deployment

[GoTrue is the same auth server that is used by Supabase](https://github.com/supabase/auth), you can think of it as a self-hosted version of Supabase Auth.

GoTrue uses Postgres as its database, and Supabase has ready-to-use React components and SDKs that we use throughout the project.

We are going to deploy this server to [Railway](https://railway.app/).

1. Fork the Github repo for this project
2. Go to [Railway](https://railway.app/) and sign up with your GitHub account
3. Create a new project
4. Click "Import from GitHub" and select the forked repo -- this should automatically create a new Railway project
5. Click the "Settings" tab on the new project
6. Click "Generate Domain" and note down this domain -- **this is the URL of your new GoTrue server** (it'll look like `https://1000x-developer-expo-next-starter-project-production.up.railway.app`)
7. Scroll down to "Config-as-code" in the settings tab and click "Add File Path" and paste in `apps/go-true-server-railway/railway.json`
8. Click the "Variables" tab on the new project
9. Click "Raw Editor" and paste the following:
    ```env
    API_EXTERNAL_URL="THE_RAILWAY_DOMAIN_FROM_PREVIOUS_STEP"
    GOTRUE_API_HOST="0.0.0.0"
    GOTRUE_API_PORT="9999"
    GOTRUE_CORS_ALLOWED_HEADERS="Authorization,X-Client-Info,apikey,Content-Type"
    GOTRUE_CORS_ALLOWED_METHODS="GET,POST,PUT,DELETE,OPTIONS"
    GOTRUE_CORS_ALLOWED_ORIGINS="WE_WILL_SET_THIS_LATER"
    GOTRUE_CORS_MAX_AGE="3600"
    GOTRUE_DB_DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_USER_PASSWORD@THE_NON_POOLED_URL_FROM_STEP_1/app?sslmode=require&channel_binding=require"
    GOTRUE_DB_DRIVER="postgres"
    GOTRUE_DB_NAME="app"
    GOTRUE_DISABLE_SIGNUP="false"
    GOTRUE_EXTERNAL_EMAIL_ENABLED="true"
    GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID="test"
    GOTRUE_EXTERNAL_GOOGLE_ENABLED="true"
    GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI="test"
    GOTRUE_EXTERNAL_GOOGLE_SECRET="test"
    GOTRUE_JWT_DEFAULT_GROUP_NAME="authenticated"
    GOTRUE_JWT_EXP="3600"
    GOTRUE_JWT_SECRET="THE_JWT_SECRET_FROM_THE_SECRETS_PROD_FILE"
    GOTRUE_LOG_LEVEL="warn"
    GOTRUE_MAILER_EXTERNAL_HOSTS="test"
    GOTRUE_SERVICE_ROLE_KEY="THE_GOTRUE_SERVICE_ROLE_KEY_FROM_THE_SECRETS_PROD_FILE"
    GOTRUE_SITE_URL="WE_WILL_SET_THIS_LATER"
    GOTRUE_URI_ALLOW_LIST="WE_WILL_SET_THIS_LATER"
    PORT="9999"
    RAILWAY_DOCKERFILE_PATH="apps/go-true-server-railway/Dockerfile"
    ```

    We will update the `GOTRUE_CORS_ALLOWED_ORIGINS`, `GOTRUE_SITE_URL` and `GOTRUE_URI_ALLOW_LIST` after we deploy the Next app to Vercel.
10. Make sure that the project starts successfully by clicking the "Deploy" button.
11. Your deployment should succeed, and the project should have status "Active"

Your GoTrue server is now deployed and ready to be used. [You should be able to visit `/healthz` and see a 200 response.](https://1000x-developer-expo-next-starter-project-production.up.railway.app/health) (this link routes to a server I deployed for the starter project deployed as part of the blog post).

## Step 4. Deploying the API

We'll be deploying the API to Cloudflare Workers. Cloudflare Workers are a serverless platform that allows us to deploy our API to a global network of edge servers.

Cloudflare Workers are:

- Fast
- Cheap
- Easy to deploy
- Easy to scale
- Easy to manage
- Easy to monitor
- Easy to debug

1. Create a new Cloudflare account
2. Login to wrangler by running `bunx wrangler login`
3. Update the `apps/http-server/wrangler.toml` file with the following changes:

    ```toml
    GOTRUE_URL = "THE_RAILWAY_DOMAIN_FROM_PREVIOUS_STEP"
    APP_CONFIG_GOTRUE_URL = "THE_RAILWAY_DOMAIN_FROM_PREVIOUS_STEP"
    ```

4. Deploy the project with `task http-server:deploy:prod` -- the output will look like this:

    ```bash
    task http-server:deploy:prod
    task: [http-server:deploy:prod] bunx wrangler deploy --env production

    ⛅️ wrangler 4.30.0
    ─────────────────────────────────────────────
    [custom build] Running: echo 'No build step required'
    [custom build] No build step required
    [custom build] 
    Total Upload: 2307.17 KiB / gzip: 425.03 KiB
    Worker Startup Time: 64 ms
    Your Worker has access to the following bindings:
    Binding                                                                                 Resource                  
    env.LOG_LEVEL ("info")                                                                  Environment Variable      
    env.SHOULD_HOST_OPENAPI_SERVER ("false")                                                Environment Variable      
    env.USE_IN_MEMORY_STORAGE ("false")                                                     Environment Variable      
    env.USE_WORKERS_DB ("true")                                                             Environment Variable      
    env.PREMIUM_MONTHLY_STRIPE_PRODUCT_ID ("test")                                          Environment Variable      
    env.GOTRUE_URL ("https://1000x-developer-expo-next-sta...")                             Environment Variable      
    env.APP_CONFIG_GOTRUE_URL ("https://1000x-developer-expo-next-sta...")                  Environment Variable      
    env.env ({"production":{"secrets_store_secrets...)                                      Environment Variable      

    Uploaded starter-project-api-production (2.97 sec)
    Deployed starter-project-api-production triggers (1.53 sec)
    https://starter-project-api-production.abeahmed2.workers.dev
    Current Version ID: 886da6a8-1d8a-4d50-8c8b-425b843c9c8c
    ```

    The API is now deployed, and the `https://starter-project-api-production.abeahmed2.workers.dev` URL is **the URL of the API**.

5. Run the secret setup command `task http-server:secrets:set:prod` -- this will set all the secrets in the `.secrets.prod` file as Cloudflare secrets. These secrets persist across deployments, and if you need to update them you can run the command again or update them in the dashboard.

Your API is now deployed! Note the URL of the API as we'll need it in the next step.

You should be able to visit the health endpoint of the API to ensure it's running:

```bash
curl https://starter-project-api-production.abeahmed2.workers.dev/health # replace it with your API URL
```

## Step 5. Deploying the Next App

We'll be deploying the Next app to Vercel. You can deploy the project to
any platform that can run a NextJS app, I just happen to like Vercel.

1. Create a new Vercel project
2. Point at your forked repo
3. The "Root Directory" should automatically be set to `apps/next-app`, if not, set it to `apps/next-app`
4. Expand the "Build and Output Settings" section and set the "Output Directory" to `apps/next-app/.next` and set:
    - `Build Command` to `bun run build`
    - `Output Directory` to `.next`
    - `Install Command` to `bun install`
5. Expand the "Environment Variables" section and set the following variables:
    - `NEXT_PUBLIC_GOTRUE_URL` to the GoTrue server URL (it'll look like `https://1000x-developer-expo-next-starter-project-production.up.railway.app`)
    - `NEXT_PUBLIC_TRPC_SERVER_URL` to the API URL (it'll look like `https://starter-project-api-production.abeahmed2.workers.dev`)
6. Click "Deploy"

Your Next app is now deployed! Note the URL of the app as we'll need it in the next step.

## Step 6. Configuring the GoTrue server

Navigate back to Railway and update the following variables:

- `GOTRUE_CORS_ALLOWED_ORIGINS` to the Vercel app URL (it'll look like `https://1000x-developer-expo-next-starter-project-production.vercel.app`)
- `GOTRUE_SITE_URL` to the Vercel app URL (it'll look like `https://1000x-developer-expo-next-starter-project-production.vercel.app`)
- `GOTRUE_URI_ALLOW_LIST` to the Vercel app URL (it'll look like `https://1000x-developer-expo-next-starter-project-production.vercel.app/*`)

---

You should now be able to navigate to the Vercel app and login and logout of the app.

You can browse the data in Neon using their dashboard. You can also set yourself
as admin by inserting a row in the `user_roles` table with your new
user ID and the `admin` role.
