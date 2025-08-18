# Migration Plan: GoTrue to Better Auth

## Executive Summary

This document outlines a comprehensive, phased migration plan from GoTrue to Better Auth. The migration leverages Better Auth's idiomatic patterns to simplify our authentication architecture while maintaining backward compatibility during the transition period.

## Current Architecture Analysis

### GoTrue Implementation
- **Authentication Provider**: Standalone GoTrue server (via Docker locally, Railway in production)
- **Client Library**: `@supabase/gotrue-js`
- **User Data**: Hybrid approach with `auth.users` (GoTrue) + `public.users` (local profile)
- **Authorization**: Role-based using `app_metadata.roles` array
- **Services**: `SupabaseAuthService` + `UserService` pattern
- **Client State**: Zustand store with localStorage persistence

### Areas for Simplification with Better Auth
1. **Eliminate separate auth server** - Better Auth runs within your application
2. **Unified user table** - No more split between auth provider and local profile
3. **Built-in TypeScript support** - Strongly typed from server to client
4. **Simplified session management** - Better Auth's `useSession` hook with automatic updates
5. **Plugin ecosystem** - Easy extension without custom service implementations

---

## Migration Strategy: Phased Approach

### Phase 1: Database Schema Migration
**Goal**: Set up Better Auth tables alongside existing GoTrue tables

#### New Migrations Required
`packages/db-migrations/migrations/0001_better_auth_setup.sql`
```sql
-- Better Auth core tables
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "email_verified" BOOLEAN DEFAULT false,
  "name" TEXT,
  "image" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "provider" TEXT NOT NULL,
  "provider_account_id" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" TIMESTAMP WITH TIME ZONE,
  "id_token" TEXT,
  "scope" TEXT,
  "token_type" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("provider", "provider_account_id")
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend user table with our business fields (preserving hybrid approach initially)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT UNIQUE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "roles" TEXT[] DEFAULT '{}';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_session_user_id" ON "session"("user_id");
CREATE INDEX IF NOT EXISTS "idx_session_token" ON "session"("token");
CREATE INDEX IF NOT EXISTS "idx_account_user_id" ON "account"("user_id");
CREATE INDEX IF NOT EXISTS "idx_verification_identifier" ON "verification"("identifier");
```

#### Updated Type Definitions
`packages/db/src/schema/BetterAuth.drizzle.ts`
```typescript
import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  name: text("name"),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  roles: text("roles").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  idToken: text("id_token"),
  scope: text("scope"),
  tokenType: text("token_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

`packages/models/src/better-auth.ts`
```typescript
export interface BetterAuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string;
  stripeCustomerId?: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BetterAuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BetterAuthAccount {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  refreshToken?: string;
  accessToken?: string;
  expiresAt?: Date;
  idToken?: string;
  scope?: string;
  tokenType?: string;
}
```

---

### Phase 2: Server-Side Better Auth Setup

#### Core Authentication Configuration
`packages/api/src/auth/better-auth.config.ts`
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../utils/database";
import { adminPlugin } from "better-auth/plugins/admin";
import { twoFactorPlugin } from "better-auth/plugins/two-factor";
import { organizationPlugin } from "better-auth/plugins/organization";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Start without verification, enable later
    sendVerificationEmail: async ({ user, url, token }) => {
      // TODO: Implement email sending
      console.log("Send verification email", { user: user.email, url });
    },
    sendResetPassword: async ({ user, url, token }) => {
      // TODO: Implement email sending
      console.log("Send reset password email", { user: user.email, url });
    },
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session if older than 1 day
  },
  
  plugins: [
    adminPlugin({
      defaultRole: "user",
      customRoles: ["admin", "user"],
    }),
    twoFactorPlugin(),
    organizationPlugin(), // For future multi-tenancy
  ],
  
  // Custom user fields
  user: {
    additionalFields: {
      stripeCustomerId: {
        type: "string",
        required: false,
      },
      roles: {
        type: "string[]",
        defaultValue: ["user"],
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.User;
```

#### Integration with Existing Services
`packages/api/src/services/auth/better-auth.service.ts`
```typescript
import { injectable } from "inversify";
import { auth } from "../../auth/better-auth.config";
import type { AuthService } from "@starterp/models";
import { getLogger } from "../../utils/getLogger";

@injectable()
export class BetterAuthService implements AuthService {
  private readonly logger = getLogger("BetterAuthService");

  async ensureUser(
    email: string,
    password: string,
    userId?: string,
    firstName?: string,
    lastName?: string
  ): Promise<{ id: string }> {
    try {
      // Check if user exists
      const existingUser = await auth.api.getUser({ email });
      
      if (existingUser) {
        return { id: existingUser.id };
      }
      
      // Create new user
      const response = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: `${firstName} ${lastName}`.trim(),
        },
      });
      
      if (!response.user) {
        throw new Error("User creation failed");
      }
      
      return { id: response.user.id };
    } catch (error) {
      this.logger.error("Failed to ensure user", { error, email });
      throw error;
    }
  }

  async updateUserMetadata(
    userId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await auth.api.updateUser({
        userId,
        data: metadata,
      });
    } catch (error) {
      this.logger.error("Failed to update user metadata", { error, userId });
      throw error;
    }
  }

  async setUserRoles(userId: string, roles: string[]): Promise<void> {
    await this.updateUserMetadata(userId, { roles });
  }

  async getUserByEmail(email: string): Promise<{ id: string; email: string } | null> {
    try {
      const user = await auth.api.getUser({ email });
      return user ? { id: user.id, email: user.email } : null;
    } catch (error) {
      this.logger.error("Failed to get user by email", { error, email });
      return null;
    }
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      const response = await auth.api.signInEmail({
        body: { email, password },
      });
      return !!response.user;
    } catch {
      return false;
    }
  }
}
```

#### tRPC Router Integration
`apps/http-server/src/trpc/routers/better-auth.router.ts`
```typescript
import { router, publicProcedure } from "../base";
import { auth } from "@starterp/api/auth/better-auth.config";
import { toNextJsHandler } from "better-auth/next-js";

// Export Better Auth handler for mounting
export const betterAuthHandler = toNextJsHandler(auth);

// Additional tRPC procedures for custom auth operations
export const betterAuthRouter = router({
  // Keep existing custom auth operations that Better Auth doesn't handle
  getSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.headers) return null;
    
    const session = await auth.api.getSession({
      headers: ctx.headers,
    });
    
    return session;
  }),
});
```

`apps/http-server/src/server.ts` (Update mounting)
```typescript
// Mount Better Auth at /api/auth/*
app.all("/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});
```

---

### Phase 3: Client-Side Migration

#### Better Auth Client Setup
`apps/next-app/src/lib/auth-client.ts`
```typescript
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3042",
  
  plugins: [
    twoFactorClient({
      twoFactorPage: "/auth/two-factor",
    }),
    adminClient(),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
```

#### Migration of Auth Components
`apps/next-app/src/providers/better-auth-provider.tsx`
```typescript
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth-store";

export function BetterAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        roles: session.user.roles || [],
      });
      setToken(session.session.token);
    } else if (!isPending) {
      setUser(null);
      setToken(null);
    }
  }, [session, isPending, setUser, setToken]);
  
  return <>{children}</>;
}
```

#### Updated Login Page
`apps/next-app/src/pages/login.tsx`
```typescript
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { data, error } = await signIn.email({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      callbackURL: "/dashboard",
    }, {
      onSuccess: () => {
        router.push("/dashboard");
      },
      onError: (ctx) => {
        setError(ctx.error.message);
      },
    });
  };
  
  const handleGoogleLogin = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };
  
  return (
    <form onSubmit={handleEmailLogin}>
      {/* Form fields */}
    </form>
  );
}
```

#### Protected Routes with Better Auth
`apps/next-app/src/components/auth/protected-route.tsx`
```typescript
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);
  
  if (isPending) {
    return <div>Loading...</div>;
  }
  
  if (!session) {
    return null;
  }
  
  return <>{children}</>;
}
```

---

### Phase 4: Data Migration

#### User Data Migration Script
`packages/db-migrations/scripts/migrate-users-to-better-auth.ts`
```typescript
import { db } from "@starterp/db";
import { auth } from "@starterp/api/auth/better-auth.config";
import { GoTrueUsersDatabaseSchema } from "@starterp/db";

async function migrateUsers() {
  console.log("Starting user migration from GoTrue to Better Auth...");
  
  // Fetch all GoTrue users
  const goTrueUsers = await db
    .select()
    .from(GoTrueUsersDatabaseSchema);
  
  let migrated = 0;
  let failed = 0;
  
  for (const goTrueUser of goTrueUsers) {
    try {
      // Check if user already migrated
      const existingUser = await auth.api.getUser({ 
        email: goTrueUser.email 
      });
      
      if (existingUser) {
        console.log(`User ${goTrueUser.email} already migrated`);
        continue;
      }
      
      // Create user in Better Auth (password will need reset)
      await auth.api.createUser({
        id: goTrueUser.id,
        email: goTrueUser.email,
        emailVerified: goTrueUser.emailConfirmedAt !== null,
        name: goTrueUser.rawAppMetaData?.full_name,
        roles: goTrueUser.rawAppMetaData?.roles || ["user"],
        createdAt: goTrueUser.createdAt,
      });
      
      migrated++;
      console.log(`Migrated user: ${goTrueUser.email}`);
    } catch (error) {
      failed++;
      console.error(`Failed to migrate user ${goTrueUser.email}:`, error);
    }
  }
  
  console.log(`Migration complete: ${migrated} succeeded, ${failed} failed`);
}

// Run migration
migrateUsers().catch(console.error);
```

---

### Phase 5: Testing & Validation

#### Test Plan
1. **Unit Tests**: Test all auth service methods
2. **Integration Tests**: Test auth flows end-to-end
3. **Migration Tests**: Verify data integrity after migration
4. **Performance Tests**: Compare response times with GoTrue

#### Rollback Strategy
1. Keep GoTrue tables intact during migration
2. Implement feature flags to switch between auth systems
3. Maintain backward compatibility in API endpoints
4. Document rollback procedures

---

### Phase 6: Cutover & Cleanup

#### Cutover Checklist
- [ ] All users migrated successfully
- [ ] Password reset emails sent to users
- [ ] Feature flags enabled for Better Auth
- [ ] Monitoring and alerts configured
- [ ] Documentation updated

#### Cleanup Tasks
1. Remove GoTrue Docker configuration
2. Remove GoTrue Railway deployment
3. Drop GoTrue database tables
4. Remove GoTrue dependencies from package.json
5. Remove legacy auth service implementations
6. Update environment variables

---

## Benefits After Migration

### Immediate Benefits
1. **No separate auth server** - Reduced infrastructure complexity
2. **Unified user table** - Simplified data model
3. **Better TypeScript support** - End-to-end type safety
4. **Built-in 2FA** - Via plugin, no custom implementation
5. **Improved performance** - No cross-service HTTP calls

### Future Opportunities
1. **Passkey authentication** - Modern passwordless auth
2. **Magic links** - Email-based passwordless login
3. **Multi-tenancy** - Organization plugin for B2B features
4. **Session management** - Better control over multiple sessions
5. **Rate limiting** - Built-in protection against brute force

### Code Simplification Examples

**Before (GoTrue)**:
```typescript
// Complex service injection and manual JWT handling
@injectable()
export class SupabaseAuthService implements AuthService {
  // 200+ lines of code
}
```

**After (Better Auth)**:
```typescript
// Simple, declarative configuration
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  // Configuration-driven, not code-driven
});
```

**Before (Client)**:
```typescript
// Manual state management, token refresh, complex hooks
const { data } = await goTrueClient.signInWithPassword({...});
// Manual token storage, refresh logic, etc.
```

**After (Client)**:
```typescript
// Automatic state management and reactivity
const { data: session } = useSession();
await signIn.email({ email, password });
// Everything handled automatically
```

---

## Risk Mitigation

### Identified Risks
1. **Data Loss**: Mitigated by phased migration with validation
2. **Authentication Downtime**: Mitigated by parallel running during transition
3. **Password Reset Required**: Clear communication to users
4. **Integration Issues**: Comprehensive testing before cutover

### Monitoring Plan
- Track authentication success/failure rates
- Monitor response times
- Alert on unusual patterns
- User feedback collection

---

## Timeline Estimate

- **Phase 1 (Database)**: 1 day
- **Phase 2 (Server)**: 2 days
- **Phase 3 (Client)**: 2 days
- **Phase 4 (Migration)**: 1 day
- **Phase 5 (Testing)**: 2 days
- **Phase 6 (Cutover)**: 1 day

**Total: ~9 days** (allowing for testing and validation)

---

## Conclusion

The migration from GoTrue to Better Auth represents a significant simplification of our authentication architecture. By eliminating the need for a separate auth server and leveraging Better Auth's plugin ecosystem, we can reduce complexity while gaining modern authentication features. The phased approach ensures minimal risk and allows for validation at each step.