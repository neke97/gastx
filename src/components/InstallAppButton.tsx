"use client";

import { useState, useSyncExternalStore } from "react";

/** Evento de Chrome/Android para instalar la PWA (no está en los tipos de TS). */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    /** Lo guarda el script inline del layout raíz, que corre antes de React. */
    __gastxInstallPrompt?: InstallPromptEvent | null;
  }
}

type Mode = "hidden" | "prompt" | "ios" | "manual";

let installed = false;

function getMode(): Mode {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone || installed) return "hidden";
  if (window.__gastxInstallPrompt) return "prompt";
  const isIOS =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isIOS ? "ios" : "manual";
}

function subscribe(onChange: () => void) {
  const onPrompt = (e: Event) => {
    e.preventDefault();
    window.__gastxInstallPrompt = e as InstallPromptEvent;
    onChange();
  };
  const onInstalled = () => {
    window.__gastxInstallPrompt = null;
    installed = true;
    onChange();
  };
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

/**
 * Botón "Descargar app". En Android/Chrome abre el diálogo nativo de
 * instalación; en iPhone (que no lo permite) muestra cómo agregarla al inicio.
 * No se muestra si ya se está usando la app instalada.
 */
export function InstallAppButton({ className = "" }: { className?: string }) {
  // En el servidor no se sabe el dispositivo: oculto hasta hidratar.
  const mode = useSyncExternalStore(subscribe, getMode, () => "hidden" as Mode);
  const [showHelp, setShowHelp] = useState(false);
  const [, rerender] = useState(0);

  if (mode === "hidden") return null;

  async function handleClick() {
    const prompt = window.__gastxInstallPrompt;
    if (mode === "prompt" && prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      // El evento solo sirve una vez.
      window.__gastxInstallPrompt = null;
      if (outcome === "accepted") installed = true;
      rerender((n) => n + 1);
      return;
    }
    setShowHelp((v) => !v);
  }

  return (
    <div className={`flex w-full max-w-md flex-col items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600 px-6 py-3 font-medium text-emerald-700 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
      >
        <span aria-hidden>📲</span>
        Descargar la app
      </button>

      {showHelp && (
        <p className="rounded-lg border border-black/10 bg-black/[0.02] px-4 py-3 text-left text-sm text-black/70 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70">
          {mode === "ios" ? (
            <>
              En iPhone: abrí esta página en <b>Safari</b>, tocá{" "}
              <b>Compartir</b> (el cuadro con la flecha ↑) y elegí{" "}
              <b>Agregar a inicio</b>.
            </>
          ) : (
            <>
              Abrí el menú del navegador (<b>⋮</b>) y elegí{" "}
              <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.
            </>
          )}
        </p>
      )}
    </div>
  );
}
