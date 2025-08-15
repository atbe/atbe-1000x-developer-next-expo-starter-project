# Database Seeding Utility

This utility automatically seeds the database with initial user data.

## What it does

When run, this utility creates two users:

1. **Admin User**
   - Email: `abeahmed2@gmail.com`
   - Password: `password`
   - Role: `admin`

2. **Regular User**
   - Email: `abeahmed2+user@gmail.com`
   - Password: `password`
   - Role: `user` (default)

## Usage

The seeding happens automatically when you run:

```bash
task docker:reset
```

This command will:
1. Install dependencies
2. Destroy existing Docker containers
3. Start new Docker containers
4. Apply database migrations
5. **Run the seeding script** (creates the users)

You can also run the seeding script manually:

```bash
cd utils/seed-data && bun run seed
```

## Features

- **Idempotent**: The script checks if users already exist before creating them
- **Error handling**: Gracefully handles errors and logs them
- **Logging**: Uses the project's logging system to provide clear feedback

## Implementation

The seeding script uses the API service layer directly:
- `UserService` to create users
- `UserRoleService` to assign roles
- Proper password hashing is handled automatically by the service layer
