import type { ToolSet } from "ai";
import { tool } from "ai";
import {
  AddStockParamsSchema,
  AdjustStockParamsSchema,
  AskMetricParamsSchema,
  CreateCustomerParamsSchema,
  CreateProductAlertParamsSchema,
  CreateManyCustomersParamsSchema,
  CreateManyProductsParamsSchema,
  CreateManySuppliersParamsSchema,
  CreateProductParamsSchema,
  CreatePurchaseParamsSchema,
  CreateSaleParamsSchema,
  CreateSupplierParamsSchema,
  DeleteManyProductsParamsSchema,
  GetProductParamsSchema,
  ListCustomersParamsSchema,
  ListProductsParamsSchema,
  ListPurchasesParamsSchema,
  ListSalesParamsSchema,
  ListStockLotsParamsSchema,
  ListSuppliersParamsSchema,
  MarkExpiredParamsSchema,
  SetPriceParamsSchema,
  UpdateProductParamsSchema,
  executeAddStock,
  executeAdjustStock,
  executeAskMetric,
  executeCreateCustomer,
  executeCreateManyCustomers,
  executeCreateManyProducts,
  executeCreateManySuppliers,
  executeCreateProduct,
  executeCreateProductAlert,
  executeCreatePurchase,
  executeCreateSale,
  executeCreateSupplier,
  executeDeleteManyProducts,
  executeGetProduct,
  executeListCustomers,
  executeListProducts,
  executeListPurchases,
  executeListSales,
  executeListStockLots,
  executeListSuppliers,
  executeMarkExpired,
  executeSetPrice,
  executeUpdateProduct,
} from "../../modules/voice/voice.actions.js";

function run(
  fn: () => Promise<{ ok: boolean; message: string }>,
): Promise<string> {
  return fn().then((r) => r.message);
}

/**
 * Builds the voice action tools for a given store. All actions are scoped to that store
 * (user's store). Pass the returned ToolSet to generateText({ tools, maxSteps }).
 */
export function buildVoiceTools(storeId: string): ToolSet {
  return {
    add_stock: tool({
      description:
        "Agrega stock de un producto. Necesitas nombre o código del producto y cantidad. Opcional: expiresAt (ISO), unitCostGross.",
      inputSchema: AddStockParamsSchema,
      execute: (p) => run(() => executeAddStock(storeId, p)),
    }),
    set_price: tool({
      description:
        "Actualiza el precio de venta de un producto. Nombre o código del producto y salePriceGross (entero CLP).",
      inputSchema: SetPriceParamsSchema,
      execute: (p) => run(() => executeSetPrice(storeId, p)),
    }),
    mark_expired: tool({
      description:
        "Marca stock de un producto como vencido. Nombre o código del producto. Opcional: quantity.",
      inputSchema: MarkExpiredParamsSchema,
      execute: (p) => run(() => executeMarkExpired(storeId, p)),
    }),
    ask_metric: tool({
      description:
        "Métricas: stock_total, stock_by_product (product), sales_today, sales_range (from, to ISO), expiring_soon.",
      inputSchema: AskMetricParamsSchema,
      execute: (p) => run(() => executeAskMetric(storeId, p)),
    }),
    create_product: tool({
      description:
        "Crea un producto nuevo en la tienda. name obligatorio. Opcional: salePriceGross, category, brand, uom (UNIT, GRAM, KILOGRAM, MILLILITER, LITER).",
      inputSchema: CreateProductParamsSchema,
      execute: (p) => run(() => executeCreateProduct(storeId, p)),
    }),
    create_many_products: tool({
      description:
        "Crea varios productos a la vez. products: array de objetos con name obligatorio y opcional salePriceGross, category, brand, uom. Máximo 50 productos por llamada.",
      inputSchema: CreateManyProductsParamsSchema,
      execute: (p) => run(() => executeCreateManyProducts(storeId, p)),
    }),
    delete_many_products: tool({
      description:
        "Elimina varios productos. products: array de nombres o códigos de producto (máx 50). Los no encontrados se reportan.",
      inputSchema: DeleteManyProductsParamsSchema,
      execute: (p) => run(() => executeDeleteManyProducts(storeId, p)),
    }),
    list_products: tool({
      description:
        "Lista productos de la tienda. Opcional: query (buscar por nombre), limit.",
      inputSchema: ListProductsParamsSchema,
      execute: (p) => run(() => executeListProducts(storeId, p)),
    }),
    get_product: tool({
      description:
        "Obtiene detalle de un producto por nombre o código: stock y precio.",
      inputSchema: GetProductParamsSchema,
      execute: (p) => run(() => executeGetProduct(storeId, p)),
    }),
    update_product: tool({
      description:
        "Actualiza un producto existente. product (nombre o código). Opcional: name, salePriceGross, category, brand.",
      inputSchema: UpdateProductParamsSchema,
      execute: (p) => run(() => executeUpdateProduct(storeId, p)),
    }),
    list_stock_lots: tool({
      description:
        "Lista lotes de stock. Opcional: product (nombre o código), limit.",
      inputSchema: ListStockLotsParamsSchema,
      execute: (p) => run(() => executeListStockLots(storeId, p)),
    }),
    list_sales: tool({
      description: "Lista ventas. Opcional: from, to (ISO), limit.",
      inputSchema: ListSalesParamsSchema,
      execute: (p) => run(() => executeListSales(storeId, p)),
    }),
    list_purchases: tool({
      description: "Lista compras. Opcional: from, to (ISO), limit.",
      inputSchema: ListPurchasesParamsSchema,
      execute: (p) => run(() => executeListPurchases(storeId, p)),
    }),
    list_suppliers: tool({
      description: "Lista proveedores de la tienda. Opcional: limit.",
      inputSchema: ListSuppliersParamsSchema,
      execute: (p) => run(() => executeListSuppliers(storeId, p)),
    }),
    list_customers: tool({
      description: "Lista clientes de la tienda. Opcional: limit.",
      inputSchema: ListCustomersParamsSchema,
      execute: (p) => run(() => executeListCustomers(storeId, p)),
    }),
    adjust_stock: tool({
      description:
        "Ajusta stock de un producto (inventario). product, quantityDelta (+ o -), reason (COUNT_CORRECTION, DAMAGE, EXPIRED, THEFT, TRANSFER_OUT, TRANSFER_IN, OTHER), note opcional.",
      inputSchema: AdjustStockParamsSchema,
      execute: (p) => run(() => executeAdjustStock(storeId, p)),
    }),
    create_sale: tool({
      description:
        "Registra una venta. items: array de { product (nombre o código), quantity, unitPriceGross opcional }. Opcional: paymentMethod (CASH, DEBIT, CREDIT, TRANSFER, OTHER), customerId.",
      inputSchema: CreateSaleParamsSchema,
      execute: (p) => run(() => executeCreateSale(storeId, p)),
    }),
    create_purchase: tool({
      description:
        "Registra una compra. items: array de { product, quantity, unitCostGross opcional }. Opcional: supplierId, notes.",
      inputSchema: CreatePurchaseParamsSchema,
      execute: (p) => run(() => executeCreatePurchase(storeId, p)),
    }),
    create_supplier: tool({
      description:
        "Crea un proveedor. name obligatorio. Opcional: rut, phone, email.",
      inputSchema: CreateSupplierParamsSchema,
      execute: (p) => run(() => executeCreateSupplier(storeId, p)),
    }),
    create_many_suppliers: tool({
      description:
        "Crea varios proveedores. suppliers: array de { name, rut?, phone?, email? }. Máx 50.",
      inputSchema: CreateManySuppliersParamsSchema,
      execute: (p) => run(() => executeCreateManySuppliers(storeId, p)),
    }),
    create_customer: tool({
      description:
        "Crea un cliente. name obligatorio. Opcional: rut, phone, email.",
      inputSchema: CreateCustomerParamsSchema,
      execute: (p) => run(() => executeCreateCustomer(storeId, p)),
    }),
    create_many_customers: tool({
      description:
        "Crea varios clientes. customers: array de { name, rut?, phone?, email? }. Máx 50.",
      inputSchema: CreateManyCustomersParamsSchema,
      execute: (p) => run(() => executeCreateManyCustomers(storeId, p)),
    }),
    create_product_alert: tool({
      description:
        "Crea una alerta para un producto. product (nombre o código), type, message.",
      inputSchema: CreateProductAlertParamsSchema,
      execute: (p) => run(() => executeCreateProductAlert(storeId, p)),
    }),
  };
}
