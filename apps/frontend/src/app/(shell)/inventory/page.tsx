import { InventoryPageClient } from "@/components/inventory/InventoryPageClient";
import backend, { BackendError } from "@/lib/backend";
import { redirect } from "next/navigation";

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
