import { z } from "zod";
import { VoiceActionType } from "../../lib/generated/prisma/client.js";

export const VoiceModelOutputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("answer"),
    message: z.string().min(1),
  }),
  z.object({
    type: z.literal("clarification"),
    question: z.string().min(1),
  }),
  z.object({
    type: z.literal("action"),
    action: z.string().min(1),
    steps: z.array(z.string().min(1)).min(1),
    parameters: z.unknown().optional(),
  }),
]);

export type VoiceModelOutput = z.infer<typeof VoiceModelOutputSchema>;

export const VoiceActionNameSchema = z.enum([
  "add_stock",
  "set_price",
  "mark_expired",
  "ask_metric",
  "create_sale",
  "create_purchase",
  "adjust_stock",
  "create_alert",
  "create_product",
  "list_products",
  "get_product",
  "update_product",
  "list_stock_lots",
  "list_sales",
  "list_purchases",
  "list_suppliers",
  "list_customers",
  "create_supplier",
  "create_customer",
  "create_product_alert",
  "other",
]);

export type VoiceActionName = z.infer<typeof VoiceActionNameSchema>;

export function mapActionNameToType(
  actionName: VoiceActionName,
): VoiceActionType {
  switch (actionName) {
    case "create_sale":
      return VoiceActionType.CREATE_SALE;
    case "create_purchase":
      return VoiceActionType.CREATE_PURCHASE;
    case "add_stock":
      return VoiceActionType.ADD_STOCK;
    case "adjust_stock":
      return VoiceActionType.ADJUST_STOCK;
    case "mark_expired":
      return VoiceActionType.MARK_EXPIRED;
    case "set_price":
      return VoiceActionType.SET_PRICE;
    case "create_alert":
      return VoiceActionType.CREATE_ALERT;
    case "ask_metric":
      return VoiceActionType.ASK_METRIC;
    case "create_product_alert":
      return VoiceActionType.CREATE_ALERT;
    case "create_product":
    case "list_products":
    case "get_product":
    case "update_product":
    case "list_stock_lots":
    case "list_sales":
    case "list_purchases":
    case "list_suppliers":
    case "list_customers":
    case "create_supplier":
    case "create_customer":
    case "other":
    default:
      return VoiceActionType.OTHER;
  }
}
