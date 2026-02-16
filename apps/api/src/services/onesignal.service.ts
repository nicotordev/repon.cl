import * as OneSignal from "@onesignal/node-onesignal";

const APP_ID = process.env.ONESIGNAL_APP_ID;
const REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

let client: OneSignal.DefaultApi | null = null;

function getClient(): OneSignal.DefaultApi | null {
  if (!APP_ID || !REST_API_KEY) return null;
  if (!client) {
    const configuration = OneSignal.createConfiguration({
      restApiKey: REST_API_KEY,
    });
    client = new OneSignal.DefaultApi(configuration);
  }
  return client;
}

export interface SendPushOptions {
  /** Título de la notificación */
  title: string;
  /** Cuerpo del mensaje */
  body: string;
  /** Enviar solo a estos external_user_id (ej. clerkId). Si no se pasa, se usa included_segments: ["All"] */
  externalIds?: string[];
  /** Datos adicionales para deep link (entityType, entityId, etc.) */
  data?: Record<string, string>;
}

/**
 * Envía una notificación push vía OneSignal.
 * No hace nada si ONESIGNAL_APP_ID o ONESIGNAL_REST_API_KEY no están configurados.
 */
export async function sendPushNotification(options: SendPushOptions): Promise<boolean> {
  const api = getClient();
  if (!api || !APP_ID) return false;

  const notification = new OneSignal.Notification();
  notification.app_id = APP_ID;
  notification.contents = { en: options.body };
  notification.headings = { en: options.title };
  if (options.data) notification.data = options.data as object;

  if (options.externalIds?.length) {
    notification.include_aliases = { external_id: options.externalIds };
  } else {
    notification.included_segments = ["All"];
  }

  try {
    await api.createNotification(notification);
    return true;
  } catch (err) {
    console.error("[OneSignal] sendPushNotification failed:", err);
    return false;
  }
}

export function isOneSignalConfigured(): boolean {
  return Boolean(APP_ID && REST_API_KEY);
}
