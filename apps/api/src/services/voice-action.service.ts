import {
  AddStockParamsSchema,
  AskMetricParamsSchema,
  MarkExpiredParamsSchema,
  SetPriceParamsSchema,
  executeAddStock,
  executeAskMetric,
  executeMarkExpired,
  executeSetPrice,
} from "../modules/voice/voice.actions.js";
import type { VoiceModelOutput } from "../modules/voice/voice.contract.js";
import { VoiceActionNameSchema } from "../modules/voice/voice.contract.js";

export async function executeVoiceAction(
  storeId: string,
  modelOut: Extract<VoiceModelOutput, { type: "action" }>,
) {
  const actionName = VoiceActionNameSchema.safeParse(modelOut.action);
  const normalized: string = actionName.success ? actionName.data : "other";

  if (normalized === "add_stock") {
    const parsed = AddStockParamsSchema.safeParse(modelOut.parameters);
    if (!parsed.success)
      return {
        ok: false as const,
        message: 'Parámetros inválidos para "add_stock".',
      };
    return executeAddStock(storeId, parsed.data);
  }

  if (normalized === "set_price") {
    const parsed = SetPriceParamsSchema.safeParse(modelOut.parameters);
    if (!parsed.success)
      return {
        ok: false as const,
        message: 'Parámetros inválidos para "set_price".',
      };
    return executeSetPrice(storeId, parsed.data);
  }

  if (normalized === "mark_expired") {
    const parsed = MarkExpiredParamsSchema.safeParse(modelOut.parameters);
    if (!parsed.success)
      return {
        ok: false as const,
        message: 'Parámetros inválidos para "mark_expired".',
      };
    return executeMarkExpired(storeId, parsed.data);
  }

  if (normalized === "ask_metric") {
    const parsed = AskMetricParamsSchema.safeParse(modelOut.parameters);
    if (!parsed.success)
      return {
        ok: false as const,
        message: 'Parámetros inválidos para "ask_metric".',
      };
    return executeAskMetric(storeId, parsed.data);
  }

  return {
    ok: false as const,
    message:
      normalized === "other"
        ? "No hay ninguna acción que ejecutar. Si quieres, puedes pedir algo concreto (ej: agregar stock, poner precio, consultar métricas)."
        : `Acción no implementada: "${modelOut.action}".`,
  };
}
