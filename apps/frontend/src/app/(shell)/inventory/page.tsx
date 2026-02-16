import { redirect } from "next/navigation";
import { InventoryPageClient } from "@/src/components/inventory/InventoryPageClient";
import backend, { BackendError } from "@/src/lib/backend";

export default async function InventoryPage() {
  let products: Awaited<ReturnType<typeof backend.inventory.getProducts>> = [];

  try {
    products = await backend.inventory.getProducts();
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      redirect("/auth/sign-in");
    }

    throw error;
  }

  return <InventoryPageClient initialProducts={products} />;
}
