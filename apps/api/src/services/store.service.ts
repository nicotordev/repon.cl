import prisma from "../lib/prisma.js";

/** Resuelve la tienda para un usuario (por clerkId). requestedStoreId opcional. */
export async function resolveStoreForUser(
  clerkUserId: string,
  requestedStoreId: string | null,
) {
  const user = await prisma.user.findFirst({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  const userId = user?.id;
  if (!userId) return null;

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

  return member?.store ?? null;
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
