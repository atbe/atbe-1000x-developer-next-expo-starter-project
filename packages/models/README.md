# @starterp/models

This package contains all the shared Zod schemas and TypeScript types for the Starter Project application. It serves as the single source of truth for all business object types across the monorepo.

## Structure

- `user.ts` - User-related schemas and types
- `subscription.ts` - Subscription and tier schemas
- `system-event.ts` - System event tracking schemas
- `admin.ts` - Admin-specific response schemas
- `storage-interfaces.ts` - Storage interface definitions

## Usage

```typescript
import { 
  User, 
  userSchema,
  SubscriptionTier,
  FrontendUser,
  UserStorageInterface 
} from '@starterp/models';

// Validate data with Zod schemas
const validatedUser = userSchema.parse(userData);

// Use types in your code
const user: User = { ... };
const tier: SubscriptionTier = 'premium';
```

## Adding New Models

1. Create a new file in `src/` for your domain
2. Define Zod schemas for validation
3. Export TypeScript types using `z.infer<>`
4. Export from `index.ts`

## Benefits

- Single source of truth for all types
- Runtime validation with Zod
- Type safety across packages
- Consistent data structures
- Easy to maintain and update