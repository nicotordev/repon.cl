"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { appName } from "@/lib/env";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  HandHelping,
  Image,
  Loader2,
  Palette,
  Phone,
  Store,
  Upload,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const STEPS = [
  "welcome",
  "store",
  "phone",
  "birthDate",
  "locale",
  "theme",
  "notifications",
  "avatar",
  "done",
] as const;
const TOTAL = STEPS.length;

const STEP_CONFIG: Record<
  (typeof STEPS)[number],
  { icon: React.ElementType; title: string; subtitle: string }
> = {
  welcome: {
    icon: HandHelping,
    title: "¡Hola! Cuéntanos quién eres",
    subtitle: "Así personalizamos tu experiencia en caja e inventario.",
  },
  store: {
    icon: Store,
    title: "Tu negocio",
    subtitle: "Nombre, RUT y dirección para facturación e inventario.",
  },
  phone: {
    icon: Phone,
    title: "Teléfono de contacto",
    subtitle: "Para alertas de stock bajo y recuperación de cuenta.",
  },
  birthDate: {
    icon: Calendar,
    title: "Fecha de nacimiento",
    subtitle: "Nos ayuda a personalizar ofertas y recordatorios.",
  },
  locale: {
    icon: Globe,
    title: "Idioma",
    subtitle: "Idioma de la app para ti y tu equipo.",
  },
  theme: {
    icon: Palette,
    title: "Apariencia",
    subtitle: "Claro, oscuro o según el sistema.",
  },
  notifications: {
    icon: Bell,
    title: "Alertas y notificaciones",
    subtitle: "Avisos de inventario bajo, vencimientos y novedades.",
  },
  avatar: {
    icon: Image,
    title: "Foto de perfil",
    subtitle: "Sube una foto; se actualizará en tu cuenta.",
  },
  done: {
    icon: CheckCircle2,
    title: "Todo listo",
    subtitle: "Tu negocio está configurado. ¡A abrir la caja!",
  },
};

const LOCALES: { value: string; label: string }[] = [
  { value: "es-CL", label: "Español (Chile)" },
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

const THEMES: { value: string; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Sistema" },
];

const CURRENCIES: { value: string; label: string }[] = [
  { value: "CLP", label: "Peso chileno (CLP)" },
  { value: "ARS", label: "Peso argentino (ARS)" },
  { value: "PEN", label: "Sol (PEN)" },
  { value: "MXN", label: "Peso mexicano (MXN)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeRut, setStoreRut] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeTimezone, setStoreTimezone] = useState("America/Santiago");
  const [storeCurrency, setStoreCurrency] = useState("CLP");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [locale, setLocale] = useState("es-CL");
  const [theme, setTheme] = useState("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");

  const step = STEPS[stepIndex];
  const progress = TOTAL > 1 ? (stepIndex / (TOTAL - 1)) * 100 : 100;
  const isFirst = stepIndex === 0;
  const isLast = step === "done";

  const isStepComplete = (s: (typeof STEPS)[number]): boolean => {
    switch (s) {
      case "welcome":
        return name.trim().length > 0;
      case "store":
        return (
          storeName.trim().length > 0 &&
          storeRut.trim().length > 0 &&
          storeAddress.trim().length > 0
        );
      case "phone":
        return phone.trim().length > 0;
      case "birthDate":
        return (
          birthDate.trim().length > 0 && !Number.isNaN(Date.parse(birthDate))
        );
      case "locale":
      case "theme":
      case "notifications":
        return true;
      case "avatar":
        return true;
      case "done":
        return true;
      default:
        return false;
    }
  };

  const canGoNext = isStepComplete(step);
  const stepError =
    !canGoNext && step !== "done"
      ? (step === "welcome" && "Ingresa tu nombre") ||
        (step === "store" && "Completa nombre del negocio, RUT y dirección") ||
        (step === "phone" && "Ingresa tu teléfono") ||
        (step === "birthDate" && "Ingresa una fecha válida") ||
        null
      : null;

  const goNext = () => {
    setError(null);
    if (!canGoNext) return;
    if (stepIndex < TOTAL - 1) setStepIndex(stepIndex + 1);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLast) {
      void handleSubmit();
    } else if (canGoNext) {
      goNext();
    }
  };

  const goBack = () => {
    setError(null);
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Elige una imagen (JPEG, PNG, WebP o GIF).");
      return;
    }
    setError(null);
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/user/profile-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al subir la foto");
      }
      const data = (await res.json()) as { imageUrl?: string };
      if (data.imageUrl) setAvatarUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const payload = {
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      birthDate: birthDate || undefined,
      locale: locale || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
      completeOnboarding: true,
      preferences: {
        theme: theme || undefined,
        language: locale || undefined,
        notificationsEnabled,
      },
      store:
        storeName.trim().length > 0
          ? {
              name: storeName.trim(),
              rut: storeRut.trim() || undefined,
              address: storeAddress.trim() || undefined,
              timezone: storeTimezone || undefined,
              currency: storeCurrency || undefined,
            }
          : undefined,
    };
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await res.json()) as { ok: boolean; error?: string };
      if (result.ok) {
        router.replace("/");
        router.refresh();
      } else {
        setError(result.error ?? "No se pudo guardar");
      }
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const config = STEP_CONFIG[step];
  const StepIcon = config.icon;
  const stepNumber = stepIndex + 1;

  return (
    <form
      onSubmit={handleFormSubmit}
      className="mx-auto flex w-full max-w-lg flex-col gap-8 pb-32 pt-4"
    >
      {/* Header de Progreso */}
      <header className="space-y-4 px-1">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              Paso {stepNumber} de {TOTAL}
            </span>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Configuración
            </h1>
          </div>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {Math.round(progress)}%
          </div>
        </div>
        <Progress
          value={progress}
          className="h-2 rounded-full bg-emerald-100/50 dark:bg-emerald-900/20"
        />
      </header>

      {/* Card Principal del Paso */}
      <article className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-[2.5rem] border border-border/60 bg-card/50 p-1 shadow-2xl shadow-emerald-500/5 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/5">
        <div className="rounded-[2.2rem] bg-card p-6 sm:p-8">
          {/* Encabezado del paso */}
          <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20">
              <StepIcon className="size-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {config.title}
              </h2>
              <p className="text-sm text-muted-foreground">{config.subtitle}</p>
            </div>
          </div>

          <Separator className="mb-8 opacity-50" />

          {/* Renderizado de campos */}
          <div className="min-h-[200px]">
            {step === "welcome" && (
              <FieldGroup className="animate-in fade-in zoom-in-95 duration-300">
                <Field>
                  <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tu nombre
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="Ej. Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                      className="h-12 rounded-xl border-border/50 bg-muted/20 focus:ring-emerald-500/20"
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            )}

            {step === "store" && (
              <FieldGroup className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
                <Field>
                  <FieldLabel className="text-xs font-bold uppercase tracking-wider">
                    Nombre del negocio
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="Ej. Minimarket Central"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </FieldContent>
                </Field>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider">
                      RUT
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        placeholder="12.345.678-9"
                        value={storeRut}
                        onChange={(e) => setStoreRut(e.target.value)}
                        className="h-12 rounded-xl"
                      />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider">
                      Moneda
                    </FieldLabel>
                    <FieldContent>
                      <Select
                        value={storeCurrency}
                        onValueChange={setStoreCurrency}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-border/50 bg-muted/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                </div>

                <Field>
                  <FieldLabel className="text-xs font-bold uppercase tracking-wider">
                    Dirección física
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="Calle, número, comuna"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            )}

            {step === "phone" && (
              <FieldGroup className="animate-in fade-in zoom-in-95 duration-300">
                <Field>
                  <FieldLabel className="text-xs font-bold uppercase tracking-wider">
                    Teléfono Celular
                  </FieldLabel>
                  <FieldContent className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      +56
                    </span>
                    <Input
                      type="tel"
                      placeholder="9 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 rounded-xl pl-12"
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            )}

            {step === "birthDate" && (
              <FieldGroup className="animate-in fade-in zoom-in-95 duration-300">
                <Field>
                  <FieldLabel className="text-xs font-bold uppercase tracking-wider">
                    Fecha de nacimiento
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            )}

            {(step === "locale" || step === "theme") && (
              <FieldGroup className="animate-in fade-in zoom-in-95 duration-300">
                <Field>
                  <FieldLabel className="text-xs font-bold uppercase tracking-wider">
                    {step === "locale" ? "Idioma preferido" : "Tema visual"}
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      value={step === "locale" ? locale : theme}
                      onValueChange={step === "locale" ? setLocale : setTheme}
                    >
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(step === "locale" ? LOCALES : THEMES).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </FieldGroup>
            )}

            {step === "notifications" && (
              <FieldGroup className="animate-in fade-in zoom-in-95 duration-300">
                <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-6">
                  <Field className="flex flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <FieldLabel className="text-base font-bold text-foreground">
                        Activar alertas inteligentes
                      </FieldLabel>
                      <FieldDescription className="text-xs leading-relaxed">
                        Te avisaremos sobre stock crítico y vencimientos en{" "}
                        {appName}.
                      </FieldDescription>
                    </div>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </Field>
                </div>
              </FieldGroup>
            )}

            {step === "avatar" && (
              <FieldGroup className="animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="group relative">
                    <Avatar className="size-32 rounded-[2rem] border-4 border-emerald-500/10 shadow-inner ring-offset-4 transition-all group-hover:ring-2 group-hover:ring-emerald-500">
                      <AvatarImage src={avatarUrl} className="object-cover" />
                      <AvatarFallback className="rounded-[2rem] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                        {avatarUploading ? (
                          <Loader2 className="size-10 animate-spin" />
                        ) : (
                          <User className="size-12" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                    >
                      <Upload className="size-5" />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarFileChange}
                  />
                  <p className="max-w-[220px] text-center text-[11px] leading-relaxed text-muted-foreground">
                    Sube una foto profesional para representar tu cuenta en{" "}
                    {appName}.
                  </p>
                </div>
              </FieldGroup>
            )}

            {step === "done" && (
              <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <p className="text-sm font-medium leading-relaxed text-emerald-800 dark:text-emerald-300">
                    Tu configuración está completa. Revisa los detalles finales
                    antes de comenzar a vender.
                  </p>
                </div>
                <div className="divide-y divide-border/50 rounded-2xl border border-border/50 bg-muted/10 px-6 py-2">
                  <div className="flex justify-between py-4 text-sm">
                    <span className="text-muted-foreground">Propietario</span>
                    <span className="font-bold text-foreground">{name}</span>
                  </div>
                  <div className="flex justify-between py-4 text-sm">
                    <span className="text-muted-foreground">Tienda</span>
                    <span className="font-bold text-foreground">
                      {storeName}
                    </span>
                  </div>
                  <div className="flex justify-between py-4 text-sm">
                    <span className="text-muted-foreground">
                      Notificaciones
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {notificationsEnabled ? "Activadas" : "Desactivadas"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Errores de validación */}
      {(error || stepError) && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive animate-in slide-in-from-top-2">
          <CheckCircle2 className="size-4 rotate-180" />
          {error ?? stepError}
        </div>
      )}

      {/* Footer Fijo Navegación */}
      <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/80 p-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 lg:relative lg:border-none lg:bg-transparent lg:p-0">
        <div className="mx-auto flex max-w-lg gap-4">
          {!isFirst && (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={loading}
              className="h-14 flex-1 rounded-2xl border-2 font-bold transition-all hover:bg-muted active:scale-95"
            >
              <ChevronLeft className="mr-2 size-5" />
              Atrás
            </Button>
          )}
          <Button
            type="submit"
            disabled={!canGoNext || loading}
            className="h-14 flex-[2] rounded-2xl bg-emerald-600 text-base font-black text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 dark:bg-emerald-600"
          >
            {loading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : isLast ? (
              "Abrir mi tienda"
            ) : (
              <span className="flex items-center">
                Siguiente
                <ChevronRight className="ml-2 size-5" />
              </span>
            )}
          </Button>
        </div>
      </footer>
    </form>
  );
}
