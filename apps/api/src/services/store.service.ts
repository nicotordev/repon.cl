import prisma from "../lib/prisma.js";
import userService from "./user.service.js";

type StoreScopedUser = {
  id: string;
  name: string | null;
};

export async function resolveUserByClerkId(
  clerkUserId: string,
): Promise<StoreScopedUser | null> {
  const existingUser = await prisma.user.findFirst({
    where: { clerkId: clerkUserId },
    select: { id: true, name: true },
  });

  if (existingUser) return existingUser;

  try {
    const createdUser = await userService.getOrCreateUserByClerkId(clerkUserId);
    return { id: createdUser.id, name: createdUser.name };
  } catch (error) {
    console.error(
      "[StoreService] Failed to provision local user from Clerk",
      error,
    );
    return null;
  }
}

async function createDefaultStoreForUser(user: StoreScopedUser) {
  const displayName = user.name?.trim()
    ? `Tienda de ${user.name.trim()}`
    : "Mi tienda";

  return prisma.$transaction(async (tx) => {
    const member = await tx.storeMember.findFirst({
      where: { userId: user.id },
      include: { store: true },
      orderBy: { createdAt: "asc" },
    });

    if (member?.store) return member.store;

    const store = await tx.store.create({
      data: { name: displayName },
    });

    await tx.storeMember.create({
      data: {
        storeId: store.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    return store;
  });
}

/** Resuelve la tienda para un usuario (ya resuelto). requestedStoreId opcional. */
export async function resolveStoreForUser(
  user: StoreScopedUser,
  requestedStoreId: string | null,
) {
  const userId = user.id;

  if (requestedStoreId) {
    const member = await prisma.storeMember.findFirst({
      where: { userId, storeId: requestedStoreId },
      include: { store: true },
    });
    if (member?.store) return member.store;
    return null;
  }

  const member = await prisma.storeMember.findFirst({
    where: { userId },
    include: { store: true },
    orderBy: { createdAt: "asc" },
  });

  if (member?.store) return member.store;

  return createDefaultStoreForUser(user);
}

export function buildStoreContext(store: {
  id: string;
  name: string;
  rut: string | null;
  timezone: string;
  currency: string;
}) {
  return [
    `storeId: ${store.id}`,
    `nombre: ${store.name}`,
    `rut: ${store.rut ?? "sin_rut"}`,
    `timezone: ${store.timezone}`,
    `moneda: ${store.currency}`,
    `pais: Chile`,
    `iva: 19% (si aplica)`,
    `capacidades: stock, ventas, compras, vencimientos, precios, alertas, métricas`,
  ].join("\n");
}
