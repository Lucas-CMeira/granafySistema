// Contexto e hook dos avisos.

import { createContext, useContext } from "react";

export type ToastKind = "success" | "error" | "info";

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

export type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast precisa estar dentro de <ToastProvider>");
  }
  return context;
}
