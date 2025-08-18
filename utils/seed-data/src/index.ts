import { getLogger, UserRoleService, UserService } from "@starterp/api";
import { createContainer } from "./container";
import { getDatabase } from "./database";

const logger = getLogger("SeedData");

async function seedDatabase() {
  logger.info("Starting database seeding...");

  if (!process.env.DATABASE_URL) {
    logger.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  try {
    // Initialize the app
    logger.info("Initializing database...");
    const db = await getDatabase({
      databaseUrl: process.env.DATABASE_URL,
    });
    logger.info("Database initialized");
    const container = createContainer({
      db,
      useLocal: process.env.USE_LOCAL_STORAGE === "true",
      stripeSecretKey: "fake_default",
    });

    const userService = container.get(UserService);
    const userRoleService = container.get(UserRoleService);

    logger.info("App initialized");

    // Check if admin user already exists
    logger.info("Checking if admin user already exists...");
    const existingAdminUser = await userService.getUserByEmail(
      "welcome@starterp.com"
    );

    if (existingAdminUser) {
      logger.info("Admin user already exists, skipping creation", {
        id: existingAdminUser.id,
      });
    } else {
      // Create admin user in auth provider first
      logger.info("Creating admin user...");
      const adminUser = await userService.createUser({
        email: "admin@starterp.com",
        password: "password",
        firstName: "Abe",
        lastName: "Ahmed",
      });

      // Debug: verify the password immediately after creation
      const canVerifyAdmin = await userService.verifyPassword(
        "admin@starterp.com",
        "password"
      );
      logger.info("Admin password verification test", {
        canVerify: canVerifyAdmin,
      });

      // Set admin role
      await userService.setUserRole(adminUser.id, "admin");
      logger.info("Admin user created successfully", {
        userId: adminUser.id,
      });
    }

    // Check if regular user already exists
    const existingRegularUser =
      await userService.getUserByEmail("user@starterp.com");

    if (existingRegularUser) {
      logger.info(
        "Regular user already exists (${user@starterp.com}), skipping creation",
        {
          id: existingRegularUser.id,
        }
      );
    } else {
      // Create regular user in auth provider first
      logger.info("Creating regular user...");
      const regularUser = await userService.createUser({
        email: "user@starterp.com",
        password: "password",
        firstName: "AbeUser",
        lastName: "Ahmed",
      });

      // Debug: verify the password immediately after creation
      const canVerifyRegular = await userService.verifyPassword(
        "user@starterp.com",
        "password"
      );
      logger.info("Regular user password verification test", {
        canVerify: canVerifyRegular,
      });

      // Regular users have "user" role by default, but we can explicitly set it
      await userRoleService.setUserRole(regularUser.id, "user");
      logger.info("Regular user created successfully", {
        userId: regularUser.id,
      });
    }

    logger.info("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("Error seeding database:", { error });
    process.exit(1);
  }
}

// Run the seeding function
await seedDatabase();
