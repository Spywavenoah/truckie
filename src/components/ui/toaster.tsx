"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
  variantStyles,
} from "./toast";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type Listener = (toast: Toast) => void;

let toastId = 0;
const listeners = new Set<Listener>();

export function toast(
  title: string,
  options?: { description?: string; variant?: ToastVariant; duration?: number }
) {
  const id = `toast-${++toastId}`;
  const item: Toast = { id, title, ...options };
  listeners.forEach((fn) => fn(item));
  return id;
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (t: Toast) => addToast(t);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, [addToast]);

  return (
    <ToastProvider>
      {toasts.map((t) => {
        const v = t.variant || "default";
        return (
          <ToastRoot
            key={t.id}
            className={variantStyles[v]}
            duration={t.duration || 4000}
            onOpenChange={(open) => { if (!open) removeToast(t.id); }}
          >
            <div className="flex flex-col gap-1">
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </div>
            <ToastClose />
          </ToastRoot>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
