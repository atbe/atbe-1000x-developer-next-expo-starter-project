import { userSchema } from "@starterp/models";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../base";
import { protectedProcedure } from "../procedures/protected.procedures";

export const userRouter = router({
  getUserById: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/user/{id}",
        summary: "Get a user by ID",
        description: "Get a user by their unique identifier",
        tags: ["user"],
        protect: false,
        successDescription: "User fetched successfully",
        errorResponses: {
          404: "User not found",
        },
      },
    })
    .input(z.object({ id: z.string() }))
    .output(userSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.userService.getUserById(input.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      return user;
    }),

  createUser: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user",
        summary: "Create a new user",
        description: "Create a new user with the given email and password",
        tags: ["user"],
        protect: false,
        successDescription: "User created successfully",
        errorResponses: {
          400: "Invalid input",
        },
      },
    })
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8).describe("The password for the user"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      })
    )
    .output(userSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.userService.createUser({
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
      });
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }
      return user;
    }),

  verifyPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/verify-password",
        summary: "Verify a password",
        description: "Verify a password for a user",
        tags: ["user"],
        protect: false,
        successDescription: "Password verified successfully",
        errorResponses: {
          400: "Invalid input",
        },
      },
    })
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(4).describe("The password for the user"),
      })
    )
    .output(z.boolean())
    .mutation(async ({ ctx, input }) => {
      const isPasswordValid = await ctx.userService.verifyPassword(
        input.email,
        input.password
      );
      return isPasswordValid;
    }),

  updateProfile: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/user/profile",
        summary: "Update user profile",
        description:
          "Update the current user's profile information (currently only supports stripe customer ID)",
        tags: ["user"],
        protect: true,
        successDescription: "Profile updated successfully",
        errorResponses: {
          400: "Invalid input",
          401: "Unauthorized",
        },
      },
    })
    .input(
      z.object({
        stripeCustomerId: z.string().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        user: userSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get current user
      const user = await ctx.userService.getUserById(userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Update user
      const updatedUser = {
        ...user,
        stripeCustomerId:
          input.stripeCustomerId !== undefined
            ? input.stripeCustomerId
            : user.stripeCustomerId,
        updatedAt: new Date(),
      };

      await ctx.userService.updateUser(updatedUser);

      return {
        success: true,
        user: updatedUser,
      };
    }),

  upsertOAuthUser: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/oauth-upsert",
        summary: "Upsert OAuth user",
        description: "Create or update a user from OAuth authentication",
        tags: ["user"],
        protect: true,
        successDescription: "User upserted successfully",
        errorResponses: {
          400: "Invalid input",
          401: "Unauthorized",
          500: "Internal server error",
        },
      },
    })
    .input(z.object({}))
    .output(userSchema)
    .mutation(async ({ ctx }) => {
      try {
        // Use the authenticated user's ID and email from the JWT
        const user = await ctx.userService.upsertUserFromOAuth({
          id: ctx.user.id,
          email: ctx.user.email,
        });
        return user;
      } catch (error) {
        ctx.logger.error("Failed to upsert OAuth user", {
          error,
          userId: ctx.user.id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upsert OAuth user",
        });
      }
    }),
});
