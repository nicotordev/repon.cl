import { InventoryPageClient } from "@/src/components/inventory/InventoryPageClient";
import backend from "@/src/lib/backend";

export default async function InventoryPage() {
  const products = await backend.inventory.getProducts();
  return <InventoryPageClient initialProducts={products} />;
}
