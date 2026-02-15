import prisma from "../lib/prisma.js";
import type { Prisma } from "../lib/generated/prisma/client.js";

// The User table requires email as a unique identifier. Use 'whereUnique' with { email } or { id } as appropriate.
const userService = {
  async getUserByClerkId(clerkId: string) {
    return prisma.user.findFirst({
      where: { clerkId },
    });
  },
  async createUser(data: Prisma.UserCreateInput) {
    // The User model requires at minimum 'email', 'clerkId' is optional.
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        clerkId: data.clerkId,
      },
    });
  },
  async updateUser(
    where: Prisma.UserWhereUniqueInput,
    data: Prisma.UserUpdateInput,
  ) {
    // where must include either id or email to satisfy UserWhereUniqueInput.
    return prisma.user.update({
      where,
      data,
    });
  },
};

export default userService;
