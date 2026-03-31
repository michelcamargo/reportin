import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useBlocker, useLocation } from "react-router-dom";
import { v4 as uuid } from "uuid";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import { isValid, isAfter, startOfDay } from "date-fns";
import { TimeBlock } from "../components/TimeBlock/TimeBlock";
import { DraftDialog } from "../components/DraftDialog/DraftDialog";
import { SendConfirmDialog } from "../components/SendConfirmDialog/SendConfirmDialog";
import { useAutosave } from "../hooks/useAutosave";
import { useDraft } from "../hooks/useDraft";
import { saveReport, updateReport, updateReportStatus, buildWhatsAppLink, buildMessage, sendViaWebhook, getItem, setItem } from "../services";
import { STORAGE_KEYS } from "../constants/storage-keys";
import type { ReportFormData, TimeBlock as TimeBlockType, AppSettings, ReportLabels, SavedReport } from "../types/report";
import { DEFAULT_LABELS } from "../types/report";

import { validateTimeBlock } from "../utils/validation";

function getInitialForm(): ReportFormData {
  return {
    os: "",
    client: "",
    date: new Date().toISOString(),
    timeBlocks: [{ id: uuid(), start: "", end: "" }],
    description: "",
  };
}

const MIN_DATE = new Date(2000, 0, 1);

function isValidDate(iso: string): boolean {
  const d = new Date(iso);
  return isValid(d) && d >= MIN_DATE && !isAfter(startOfDay(d), startOfDay(new Date()));
}

export function HomePage() {
  const location = useLocation();
  const editReport = location.state?.editReport as SavedReport | undefined;

  const { draftExists, loadDraft, clearDraft } = useDraft();
  const [showDraftDialog, setShowDraftDialog] = useState(draftExists && !editReport);
  const [form, setForm] = useState<ReportFormData>(getInitialForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [labels, setLabels] = useState<ReportLabels>({ ...DEFAULT_LABELS });
  const [sending, setSending] = useState(false);

  // Erros de validação
  const [osError, setOsError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [dateError, setDateError] = useState(false);

  // Estado do dialog de confirmação
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    recipient: string;
    messagePreview: string;
    link: string;
  } | null>(null);

  const [showDraftSavedSnackbar, setShowDraftSavedSnackbar] = useState(false);

  useAutosave(form, STORAGE_KEYS.DRAFT);

  useEffect(() => {
    if (editReport) {
      setForm({
        os: editReport.os,
        client: editReport.client,
        date: editReport.date,
        timeBlocks: editReport.timeBlocks,
        description: editReport.description,
      });
      setEditingId(editReport.id);
      window.history.replaceState({}, "");
    }
  }, [editReport]);

  // Bloqueio de navegação se houver formulário não enviado (sujo)
  const hasFilledTimeBlock = form.timeBlocks.some(
    (b) => b.start.trim() !== "" || b.end.trim() !== ""
  );

  const isDirty =
    form.os.trim() !== "" ||
    form.client.trim() !== "" ||
    form.description.trim() !== "" ||
    hasFilledTimeBlock;

  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "Você tem dados não enviados. Deseja realmente sair do aplicativo?";
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isDirtyRef.current) {
        setItem(STORAGE_KEYS.DRAFT, formRef.current).catch(() => {});
        setShowDraftSavedSnackbar(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Carrega labels ao montar
  useState(() => {
    getItem<AppSettings>(STORAGE_KEYS.SETTINGS).then((s) => {
      if (s?.labels) setLabels({ ...DEFAULT_LABELS, ...s.labels });
    });
  });

  const handleContinueDraft = useCallback(() => {
    const saved = loadDraft();
    if (saved) setForm(saved);
    setShowDraftDialog(false);
  }, [loadDraft]);

  const handleDiscardDraft = useCallback(async () => {
    await clearDraft();
    setForm(getInitialForm());
    setEditingId(null);
    setShowDraftDialog(false);
  }, [clearDraft]);

  const addTimeBlock = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      timeBlocks: [...prev.timeBlocks, { id: uuid(), start: "", end: "" }],
    }));
  }, []);

  const updateTimeBlock = useCallback((id: string, field: "start" | "end", value: string) => {
    setForm((prev) => ({
      ...prev,
      timeBlocks: prev.timeBlocks.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    }));
  }, []);

  const removeTimeBlock = useCallback((id: string) => {
    setForm((prev) => {
      if (prev.timeBlocks.length <= 1) return prev;
      return {
        ...prev,
        timeBlocks: prev.timeBlocks.filter((b: TimeBlockType) => b.id !== id),
      };
    });
  }, []);

  const isSendable = useMemo(() => {
    if (form.os.trim() === "") return false;
    if (form.description.trim() === "") return false;
    if (!isValidDate(form.date)) return false;
    
    // Todos os blocos precisam ter formato válido
    const blockErrors = form.timeBlocks.map((b) => validateTimeBlock(b, form.date, true));
    if (blockErrors.some((e) => e !== null)) return false;

    return true;
  }, [form.os, form.description, form.date, form.timeBlocks]);

  const handleOsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setOsError(false);
    setForm((p) => ({ ...p, os: e.target.value }));
  }, []);

  const handleClientChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, client: e.target.value }));
  }, []);

  const handleDateChange = useCallback((date: Date | null) => {
    setDateError(false);
    if (date && isValid(date)) {
      setForm((p) => ({ ...p, date: date.toISOString() }));
    } else {
      setForm((p) => ({ ...p, date: date ? date.toISOString() : "" }));
    }
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDescriptionError(false);
    setForm((p) => ({ ...p, description: e.target.value }));
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setConfirmOpen(false);
    setConfirmData(null);
  }, []);

  // Valida e abre o dialog de confirmação (não envia ainda)
  const handleSendClick = async () => {
    let hasError = false;

    if (!form.os.trim()) {
      setOsError(true);
      hasError = true;
    }

    if (!form.description.trim()) {
      setDescriptionError(true);
      hasError = true;
    }

    if (!isValidDate(form.date)) {
      setDateError(true);
      hasError = true;
    }

    if (form.timeBlocks.length === 0) {
      alert("É necessário informar ao menos 1 período de atendimento.");
      hasError = true;
    } else {
      const blockErrors = form.timeBlocks.map((b) => validateTimeBlock(b, form.date, true));
      if (blockErrors.some((e) => e !== null)) {
        alert("Há um erro nos períodos de atendimento: certifique-se de que todos os inícios e términos estão preenchidos e válidos.");
        hasError = true;
      }
    }

    if (hasError) return;

    const settings = await getItem<AppSettings>(STORAGE_KEYS.SETTINGS);
    const updatedLabels = settings?.labels ? { ...DEFAULT_LABELS, ...settings.labels } : labels;
    setLabels(updatedLabels);

    setConfirmData({
      recipient: settings?.recipient || "",
      messagePreview: buildMessage(form, updatedLabels),
      link: buildWhatsAppLink(form, settings || { recipient: "" }),
    });
    setConfirmOpen(true);
  };

  // Confirmação: persiste e envia (via webhook ou wa.me)
  const handleConfirmSend = async () => {
    if (!confirmData) return;
    setSending(true);
    try {
      const settings = await getItem<AppSettings>(STORAGE_KEYS.SETTINGS);
      let reportId = editingId;
      if (reportId) {
        await updateReport(reportId, form);
      } else {
        reportId = await saveReport(form);
      }

      if (settings?.senderWebhookUrl && settings?.recipient) {
        await sendViaWebhook(settings.senderWebhookUrl, form, settings);
        await updateReportStatus(reportId, "pending");
      } else {
        window.open(confirmData.link, "_blank");
        await updateReportStatus(reportId, "sent");
      }

      await clearDraft();
      setForm(getInitialForm());
      setEditingId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao enviar o registro. Tente novamente.";
      alert(msg);
    } finally {
      setSending(false);
      setConfirmOpen(false);
      setConfirmData(null);
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Dialog: Intercepta navegação ao sair com formulário preenchido */}
      <Dialog open={blocker.state === "blocked"} onClose={() => blocker.state === "blocked" && blocker.reset()}>
        <DialogTitle sx={{ fontWeight: 700 }}>Sair sem enviar?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Laudo pendente, deseja salvar como rascunho ou descartá-lo?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={async () => {
              if (blocker.state === "blocked") {
                await clearDraft();
                setForm(getInitialForm());
                setEditingId(null);
                blocker.proceed();
              }
            }}
            color="error"
          >
            Descartar
          </Button>
          <Button
            onClick={async () => {
              if (blocker.state === "blocked") {
                try {
                  if (editingId) {
                    await updateReport(editingId, form);
                  } else {
                    await saveReport(form);
                  }
                  await clearDraft();
                  setForm(getInitialForm());
                  setEditingId(null);
                  blocker.proceed();
                } catch {
                  blocker.reset();
                }
              }
            }}
            variant="contained"
            color="primary"
          >
            Novo Rascunho
          </Button>
        </DialogActions>
      </Dialog>

      <DraftDialog
        open={showDraftDialog}
        onContinue={handleContinueDraft}
        onDiscard={handleDiscardDraft}
      />

      <Snackbar
        open={showDraftSavedSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowDraftSavedSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" onClose={() => setShowDraftSavedSnackbar(false)}>
          Rascunho salvo temporariamente por inatividade.
        </Alert>
      </Snackbar>

      {confirmData && (
        <SendConfirmDialog
          open={confirmOpen}
          recipient={confirmData.recipient}
          messagePreview={confirmData.messagePreview}
          onConfirm={handleConfirmSend}
          onCancel={handleCancelConfirm}
          sending={sending}
        />
      )}

      <Stack spacing={2.5}>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            bgcolor: "background.default",
            zIndex: 10,
            py: 2,
            mx: -2,
            px: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" minHeight={40}>
            <Typography variant="h5" fontWeight={700}>
              {editingId ? "Editando registro" : "Novo registro"}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              onClick={handleSendClick}
              disabled={sending || !isSendable}
              sx={{ flexShrink: 0 }}
            >
              {sending ? "Enviando..." : "Enviar via WhatsApp"}
            </Button>
          </Stack>
        </Box>

        <TextField
          label={`${DEFAULT_LABELS.os} *`}
          value={form.os}
          onChange={handleOsChange}
          error={osError}
          helperText={osError ? "Campo obrigatório" : undefined}
          fullWidth
        />

        <TextField
          label={DEFAULT_LABELS.client}
          value={form.client}
          onChange={handleClientChange}
          fullWidth
        />

        <DatePicker
          label={`${DEFAULT_LABELS.date} *`}
          value={new Date(form.date)}
          onChange={handleDateChange}
          minDate={MIN_DATE}
          maxDate={new Date()}
          slotProps={{
            textField: {
              fullWidth: true,
              error: dateError,
              helperText: dateError
                ? "Data inválida ou no futuro. Informe uma data válida."
                : undefined,
            },
          }}
          disableFuture
        />

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              {DEFAULT_LABELS.periods}
            </Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addTimeBlock}>
              Adicionar Período
            </Button>
          </Stack>

          {form.timeBlocks.length === 0 && (
            <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
              Nenhum período adicionado ainda.
            </Typography>
          )}

          <Stack spacing={1}>
            {form.timeBlocks.map((block, index) => (
              <TimeBlock
                key={block.id}
                block={block}
                index={index}
                reportDate={form.date}
                canRemove={form.timeBlocks.length > 1}
                onChange={updateTimeBlock}
                onRemove={removeTimeBlock}
              />
            ))}
          </Stack>
        </Box>

        <Divider />

        <TextField
          label={`${DEFAULT_LABELS.description} *`}
          value={form.description}
          onChange={handleDescriptionChange}
          error={descriptionError}
          helperText={descriptionError ? "Campo obrigatório" : undefined}
          multiline
          minRows={4}
          fullWidth
          placeholder="Descreva os serviços realizados..."
        />

      </Stack>
    </Box>
  );
}
