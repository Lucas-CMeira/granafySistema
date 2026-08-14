// Sistema de avisos do app.
//
// Substitui os alert() do navegador: eles travam a página, não têm identidade
// visual e obrigam o usuário a clicar "OK" para continuar.


import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MdCheckCircle, MdErrorOutline, MdInfoOutline, MdClose } from "react-icons/md";
import { ToastContext } from "./toast-context";
import type { Toast, ToastApi, ToastKind } from "./toast-context";

const STYLES: Record<ToastKind, { bar: string; icon: string; Icon: typeof MdCheckCircle }> = {
  success: { bar: "bg-emerald-500", icon: "text-emerald-600", Icon: MdCheckCircle },
  error: { bar: "bg-rose-500", icon: "text-rose-600", Icon: MdErrorOutline },
  info: { bar: "bg-ocean-500", icon: "text-ocean-600", Icon: MdInfoOutline },
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId++;
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      kind === "error" ? 6000 : 3800
    );
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message: string) => push("success", message),
      error: (message: string) => push("error", message),
      info: (message: string) => push("info", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
      >
        {toasts.map((toast) => {
          const { bar, icon, Icon } = STYLES[toast.kind];
          return (
            <div
              key={toast.id}
              role={toast.kind === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full animate-slide-in-right items-start gap-3 overflow-hidden rounded-2xl border border-ink-100 bg-white p-3.5 shadow-pop"
            >
              <span aria-hidden className={`h-full w-1 shrink-0 self-stretch rounded-full ${bar}`} />
              <Icon className={`mt-0.5 shrink-0 text-lg ${icon}`} />
              <p className="flex-1 text-sm leading-snug text-ink-700">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Fechar aviso"
                className="shrink-0 rounded-lg p-1 text-ink-300 transition hover:bg-ink-50 hover:text-ink-600"
              >
                <MdClose />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
