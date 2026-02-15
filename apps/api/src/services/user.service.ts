import prisma from "../lib/prisma.js";
import type { Prisma } from "../lib/generated/prisma/client.js";

// Custom error for more descriptive user-related issues
class UserServiceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "UserServiceError";
    if (cause) {
      // Node.js >=16.9.0 supports the cause property
      this.cause = cause;
    }
  }
}

// The User table requires email as a unique identifier. Use 'whereUnique' with { email } or { id } as appropriate.
const userService = {
  async getUserByClerkId(clerkId: string) {
    try {
      const user = await prisma.user.findFirst({
        where: { clerkId },
      });
      return user;
    } catch (error) {
      console.error("[UserService] Error in getUserByClerkId:", error, "Input clerkId:", clerkId);
      throw new UserServiceError("Failed to fetch user by Clerk ID.", error);
    }
  },
  async createUser(data: Prisma.UserCreateInput) {
    try {
      // The User model requires at minimum 'email', 'clerkId' is optional.
      if (!data.email) {
        throw new UserServiceError("Email is required to create a user.");
      }
      return await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          clerkId: data.clerkId,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error && error.code === "P2002") {
        // Prisma Unique Constraint violation
        const message = `A user with this email or clerkId already exists.`;
        console.error("[UserService] Unique constraint violation in createUser:", error, "Input data:", data);
        throw new UserServiceError(message, error);
      }
      console.error("[UserService] Error in createUser:", error, "Input data:", data);
      throw new UserServiceError("Failed to create user.", error);
    }
  },
  async updateUser(
    where: Prisma.UserWhereUniqueInput,
    data: Prisma.UserUpdateInput,
  ) {
    try {
      if (!where || (!where.id && !where.email)) {
        throw new UserServiceError("A unique 'id' or 'email' is required to update the user.");
      }
      return await prisma.user.update({
        where,
        data,
      });
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error && error.code === "P2025") {
        // Record to update not found.
        const msg = "User to update not found.";
        console.error("[UserService] User not found in updateUser:", error, "Where:", where, "Update data:", data);
        throw new UserServiceError(msg, error);
      }
      console.error("[UserService] Error in updateUser:", error, "Where:", where, "Update data:", data);
      throw new UserServiceError("Failed to update user.", error);
    }
  },
};

export default userService;
