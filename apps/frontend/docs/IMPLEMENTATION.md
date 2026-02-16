# Documentación de implementación – Frontend

Este documento describe cómo integrar con la API desde el frontend Next.js: voz (copiloto), subida de foto de perfil y convenciones de uso de la API.

---

## 1. API de voz (copiloto)

El flujo de voz permite al usuario grabar un mensaje, enviarlo al backend para transcribirlo y ejecutar acciones (agregar stock, consultar métricas, etc.) mediante herramientas del modelo. La respuesta es un mensaje de texto que se puede mostrar o reproducir.

### 1.1 Endpoint

- **URL**: `POST {API_BASE}/api/v1/chat/voice`
- **API_BASE**: `process.env.NEXT_PUBLIC_API_URL` (ej. `http://localhost:4000`).
- **Autenticación**: cookies de sesión de Clerk. El `fetch` debe ir con `credentials: "include"` para enviar cookies (o el backend puede usar un Bearer token si se envía en cabecera).

### 1.2 Request

- **Content-Type**: `multipart/form-data`.
- **Campos**:
  - **`audio`** (requerido): archivo de audio (Blob/File). Formatos soportados: `audio/webm`, `audio/mp4`, `audio/mpeg`, `audio/ogg`, `audio/wav`, `audio/x-wav`.
  - **`storeId`** (opcional): ID de la tienda sobre la que actuar. Si no se envía, el backend usa la tienda por defecto del usuario.
  - **`sessionId`** (opcional): ID de sesión de voz para mantener historial de conversación.

Límites del backend:

- Tamaño máximo del audio: **15 MB**.
- Si el audio está vacío o falta el campo `audio`, el backend responde 400.

### 1.3 Response exitosa (200)

La API puede devolver **streaming** (recomendado) o JSON de una sola vez.

**Streaming** (`Content-Type: application/x-ndjson`): el body es un flujo de líneas NDJSON:

1. **meta**: `{"type":"meta","sessionId":"...","transcript":"..."}` — transcripción y sesión.
2. **chunk**: `{"type":"chunk","text":"..."}` — fragmentos del mensaje (varios).
3. **done**: `{"type":"done","message":"..."}` — mensaje final completo.
4. **error** (si algo falla durante el stream): `{"type":"error","message":"..."}`.

El cliente puede mostrar `transcript` en cuanto llega `meta` y ir concatenando `chunk.text` para mostrar la respuesta en tiempo real.

**JSON de una sola vez** (respuestas cortas, p. ej. audio vacío): mismo formato que antes:

```ts
{
  sessionId: string;
  transcript: string;
  response: { type: "answer"; message: string };
}
```

### 1.4 Respuestas de error

- **401 Unauthorized**: `{ error: "Unauthorized", code: "UNAUTHORIZED" }` — usuario no autenticado.
- **400 Bad Request**: p. ej. `{ error: "Falta archivo \"audio\" (multipart/form-data).", code: "AUDIO_MISSING" }` o `{ error: "El archivo \"audio\" está vacío.", code: "AUDIO_EMPTY" }`.
- **413 Payload Too Large**: `{ error: "El audio excede el límite (15MB).", code: "AUDIO_TOO_LARGE" }`.
- **415 Unsupported Media Type**: `{ error: "Tipo de audio no soportado: \"...\".", code: "AUDIO_UNSUPPORTED_TYPE" }`.
- **500 Internal Server Error**: `{ error: "Ha ocurrido un error procesando el audio.", code: "INTERNAL_ERROR" }`.

En algunos 200 (p. ej. contexto inválido o sin tienda), el body puede incluir `transcript` y `response` con un mensaje de fallback; el frontend puede tratarlos igual que en éxito y mostrar `response.message` si existe.

### 1.5 Implementación en el frontend

- **Hook**: `useVoiceRecording` (`src/hooks/use-voice-recording.ts`).
  - Estados: `IDLE` → `RECORDING` → `PROCESSING` → `RESPONDING` | `ERROR` → `IDLE`.
  - Envía `FormData` con `audio` al endpoint anterior con `credentials: "include"`.
  - El resultado expuesto es `VoiceResult`: `{ transcript, response }`, donde `response` es el **string** del mensaje (extraído de `response.message` del body).
- **Tipos**: `src/lib/voice-types.ts` (`VoiceState`, `VoiceResult`, `VoiceRecordingState`).
- **UI**: `VoiceButton` (`src/components/voice/VoiceButton.tsx`) usa el hook y muestra `result.transcript` y `result.response`.

Para alinear con la API, el hook debe interpretar el body así:

```ts
// Success body from API
const data = await res.json();
const message =
  data.response && typeof data.response === "object" && "message" in data.response
    ? (data.response as { message: string }).message
    : typeof data.response === "string"
      ? data.response
      : "";
const result: VoiceResult = {
  transcript: data.transcript ?? "",
  response: message,
};
```

Así se soporta tanto `response: { type: "answer", message: "..." }` como un posible `response` string legacy.

### 1.6 Envío de `storeId` y `sessionId`

Para que el copiloto actúe sobre una tienda concreta y mantenga contexto:

- Añadir al `FormData` antes del `fetch`:
  - `form.append("storeId", storeId)` si tienes la tienda seleccionada.
  - `form.append("sessionId", sessionId)` si quieres reutilizar una sesión (p. ej. guardando `sessionId` del primer 200 y enviándolo en las siguientes peticiones).

---

## 2. Subida de foto de perfil

- **URL (Next.js proxy)**: `POST /api/user/profile-image`.
- **Backend real**: `POST {API_URL}/api/v1/user/profile-image` (el proxy de Next reenvía con el token de Clerk).

Request: `multipart/form-data` con campo **`file`** (imagen: JPEG, PNG, WebP, GIF).  
Respuesta exitosa: `{ imageUrl: string }`.  
Errores: 400/500 con `{ error: string }` (mensaje en español cuando está disponible).

Uso típico: formulario de onboarding o ajustes de perfil; tras un 200, actualizar la UI con `imageUrl` (avatar).

---

## 3. Uso general de la API

- Las rutas bajo `/api/v1/*` son del backend (Hono). El frontend puede llamarlas:
  - **Directo**: si el dominio del backend está en `NEXT_PUBLIC_API_URL` y las cookies se envían (mismo sitio o CORS/configuración correcta).
  - **Proxy Next.js**: rutas bajo `/api/*` en Next que reenvían al backend (ej. `/api/user/profile-image`).
- Para voz se usa **llamada directa** al backend (`NEXT_PUBLIC_API_URL + "/api/v1/chat/voice"`) con `credentials: "include"` para que las cookies de Clerk se envíen.
- Errores: revisar `res.ok` y el body JSON; si viene `error`, mostrarlo al usuario.

---

## 4. Resumen de tipos (voz)

```ts
// Respuesta exitosa del POST /api/v1/chat/voice
interface VoiceApiSuccess {
  sessionId: string;
  transcript: string;
  response: { type: "answer"; message: string };
}

// Lo que el hook expone al UI
interface VoiceResult {
  transcript: string;
  response: string;  // = VoiceApiSuccess.response.message
}
```

Si quieres, en un siguiente paso se puede actualizar el hook para enviar `storeId`/`sessionId` y centralizar la extracción de `response.message` en un tipo compartido con la API.
