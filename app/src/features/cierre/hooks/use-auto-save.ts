"use client";

import { useRef, useEffect, useCallback, useTransition } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { guardarCierreDraft } from "../actions";
import type { CierreFormValues } from "../schema";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type LocalDraft = {
  values: CierreFormValues;
  step: number;
  timestamp: number;
};

type AutoSaveOptions = {
  form: UseFormReturn<CierreFormValues>;
  step: number;
  fecha: string;
  userId: string;
  cerrado: boolean;
  dbUpdatedAt: string | null;
};

type AutoSaveReturn = {
  status: SaveStatus;
  lastSavedAt: Date | null;
  localDraft: LocalDraft | null;
  restoreLocalDraft: () => void;
  discardLocalDraft: () => void;
  notifyManualSave: () => void;
  /** Fuerza un guardado inmediato a DB (cancela debounce pendiente). */
  forceSaveNow: () => void;
};

function storageKey(userId: string, fecha: string) {
  return `cierre-draft-${userId}-${fecha}`;
}

function readLocalDraft(userId: string, fecha: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(userId, fecha));
    if (!raw) return null;
    return JSON.parse(raw) as LocalDraft;
  } catch {
    return null;
  }
}

function writeLocalDraft(userId: string, fecha: string, draft: LocalDraft) {
  try {
    localStorage.setItem(storageKey(userId, fecha), JSON.stringify(draft));
  } catch {
    // Quota exceeded — silently ignore
  }
}

function clearLocalDraft(userId: string, fecha: string) {
  try {
    localStorage.removeItem(storageKey(userId, fecha));
  } catch {
    // ignore
  }
}

export function useAutoSave({
  form,
  step,
  fecha,
  userId,
  cerrado,
  dbUpdatedAt,
}: AutoSaveOptions): AutoSaveReturn {
  const [isPending, startTransition] = useTransition();
  const statusRef = useRef<SaveStatus>("idle");
  const lastSavedAtRef = useRef<Date | null>(null);
  const localDraftRef = useRef<LocalDraft | null>(null);
  const lastSavedJsonRef = useRef<string>("");
  const stepRef = useRef(step);
  stepRef.current = step;

  // Force re-render helper
  const [, forceUpdate] = useTransition();
  const triggerRender = useCallback(() => {
    forceUpdate(() => {});
  }, [forceUpdate]);

  const setStatus = useCallback((s: SaveStatus) => {
    statusRef.current = s;
    triggerRender();
  }, [triggerRender]);

  const setLastSavedAt = useCallback((d: Date | null) => {
    lastSavedAtRef.current = d;
    triggerRender();
  }, [triggerRender]);

  const setLocalDraft = useCallback((d: LocalDraft | null) => {
    localDraftRef.current = d;
    triggerRender();
  }, [triggerRender]);

  // ─── Capa 2: localStorage (debounce 2s) ─────────────────────────────────
  const saveToLocal = useCallback(() => {
    if (cerrado) return;
    const values = form.getValues();
    const draft: LocalDraft = {
      values,
      step: stepRef.current,
      timestamp: Date.now(),
    };
    writeLocalDraft(userId, fecha, draft);
  }, [form, userId, fecha, cerrado]);

  const [debouncedLocalSave] = useDebouncedCallback(saveToLocal, 2000);

  // ─── Capa 3: DB save (debounce 30s) ─────────────────────────────────────
  const saveToDb = useCallback(() => {
    if (cerrado) return;
    const values = form.getValues();
    const json = JSON.stringify(values);
    if (json === lastSavedJsonRef.current) return; // No changes

    setStatus("saving");
    startTransition(async () => {
      const res = await guardarCierreDraft(values, fecha);
      if (res.ok) {
        lastSavedJsonRef.current = json;
        setStatus("saved");
        setLastSavedAt(new Date(res.savedAt));
        clearLocalDraft(userId, fecha);
      } else {
        setStatus("error");
      }
    });
  }, [form, fecha, userId, cerrado, setStatus, setLastSavedAt]);

  const [debouncedDbSave, cancelDbSave] = useDebouncedCallback(saveToDb, 8_000);

  // ─── Watch cambios del formulario → trigger ambos debounces ─────────────
  useEffect(() => {
    if (cerrado) return;
    const subscription = form.watch(() => {
      debouncedLocalSave();
      debouncedDbSave();
    });
    return () => subscription.unsubscribe();
  }, [form, cerrado, debouncedLocalSave, debouncedDbSave]);

  // ─── Al cambiar de paso → guardado DB inmediato ─────────────────────────
  const prevStepRef = useRef(step);
  useEffect(() => {
    if (cerrado) return;
    if (prevStepRef.current !== step) {
      prevStepRef.current = step;
      cancelDbSave();
      saveToDb();
    }
  }, [step, cerrado, cancelDbSave, saveToDb]);

  // ─── Capa 1: beforeunload + visibilitychange ───────────────────────────
  useEffect(() => {
    if (cerrado) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (form.formState.isDirty) {
        e.preventDefault();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        saveToLocal(); // Immediate save, no debounce
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [cerrado, form, saveToLocal]);

  // ─── Al montar o cambiar fecha: detectar borrador local ────────────────
  useEffect(() => {
    if (cerrado) {
      setLocalDraft(null);
      return;
    }
    const draft = readLocalDraft(userId, fecha);
    if (!draft) {
      setLocalDraft(null);
      return;
    }

    // Comparar con DB: si DB es más reciente, descartar local
    if (dbUpdatedAt) {
      const dbTime = new Date(dbUpdatedAt).getTime();
      if (draft.timestamp <= dbTime) {
        clearLocalDraft(userId, fecha);
        setLocalDraft(null);
        return;
      }
    }

    // localStorage es más reciente → ofrecer restaurar
    setLocalDraft(draft);
  }, [userId, fecha, cerrado, dbUpdatedAt, setLocalDraft]);

  // ─── Snapshot para comparación (reset al cambiar fecha) ────────────────
  useEffect(() => {
    lastSavedJsonRef.current = JSON.stringify(form.getValues());
    statusRef.current = "idle";
    lastSavedAtRef.current = null;
  }, [fecha, form]);

  // ─── API pública ────────────────────────────────────────────────────────
  const restoreLocalDraft = useCallback(() => {
    const draft = localDraftRef.current;
    if (!draft) return;
    form.reset(draft.values);
    setLocalDraft(null);
    clearLocalDraft(userId, fecha);
  }, [form, userId, fecha, setLocalDraft]);

  const discardLocalDraft = useCallback(() => {
    setLocalDraft(null);
    clearLocalDraft(userId, fecha);
  }, [userId, fecha, setLocalDraft]);

  const notifyManualSave = useCallback(() => {
    lastSavedJsonRef.current = JSON.stringify(form.getValues());
    cancelDbSave();
    clearLocalDraft(userId, fecha);
    setStatus("saved");
    setLastSavedAt(new Date());
  }, [form, cancelDbSave, userId, fecha, setStatus, setLastSavedAt]);

  const forceSaveNow = useCallback(() => {
    cancelDbSave();
    saveToDb();
  }, [cancelDbSave, saveToDb]);

  return {
    status: isPending ? "saving" : statusRef.current,
    lastSavedAt: lastSavedAtRef.current,
    localDraft: localDraftRef.current,
    restoreLocalDraft,
    discardLocalDraft,
    notifyManualSave,
    forceSaveNow,
  };
}
