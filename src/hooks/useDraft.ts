import { useState, useCallback, useEffect } from "react";
import { getItem, setItem, removeItem } from "../services";
import type { ReportFormData } from "../types/report";
import { STORAGE_KEYS } from "../constants/storage-keys";

export function useDraft() {
  const [draftExists, setDraftExists] = useState(false);
  const [draft, setDraft] = useState<ReportFormData | null>(null);

  useEffect(() => {
    getItem<ReportFormData>(STORAGE_KEYS.DRAFT).then((saved) => {
      if (saved) {
        setDraft(saved);
        setDraftExists(true);
      }
    });
  }, []);

  const loadDraft = useCallback((): ReportFormData | null => draft, [draft]);

  const saveDraft = useCallback(async (data: ReportFormData) => {
    await setItem(STORAGE_KEYS.DRAFT, data);
    setDraftExists(true);
    setDraft(data);
  }, []);

  const clearDraft = useCallback(async () => {
    await removeItem(STORAGE_KEYS.DRAFT);
    setDraftExists(false);
    setDraft(null);
  }, []);

  return { draftExists, loadDraft, saveDraft, clearDraft };
}
