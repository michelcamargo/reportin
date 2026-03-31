import { useEffect, useRef } from "react";
import { setItem } from "../services";

const DEFAULT_DELAY = 500;

export function useAutosave<T>(state: T, key: string, delay = DEFAULT_DELAY): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setItem(key, state).catch(() => {
        console.error("Erro ao salvar rascunho automaticamente.");
      });
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, key, delay]);
}
