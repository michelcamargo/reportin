import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Paper,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import SaveIcon from "@mui/icons-material/Save";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import LogoutIcon from "@mui/icons-material/Logout";
import LinkIcon from "@mui/icons-material/Link";
import LabelIcon from "@mui/icons-material/Label";
import { getItem, setItem } from "../services";
import { STORAGE_KEYS } from "../constants/storage-keys";
import type { AppSettings, ReportLabels } from "../types/report";
import { DEFAULT_LABELS } from "../types/report";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";

const PHONE_REGEX = /^\+?[0-9]{7,15}$/;
const URL_REGEX = /^https?:\/\/.+/;

export function SettingsPage() {
  const [recipient, setRecipient] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [labels, setLabels] = useState<ReportLabels>({ ...DEFAULT_LABELS });
  const [saved, setSaved] = useState(false);
  const [recipientError, setRecipientError] = useState(false);
  const [webhookError, setWebhookError] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  const [initialState, setInitialState] = useState<{
    recipient: string;
    webhookUrl: string;
    labels: ReportLabels;
  } | null>(null);

  const { currentUser } = useAuth();

  useEffect(() => {
    getItem<AppSettings>(STORAGE_KEYS.SETTINGS).then((s) => {
      const rec = s?.recipient || "";
      const web = s?.senderWebhookUrl || "";
      const lab = { ...DEFAULT_LABELS, ...s?.labels };
      setRecipient(rec);
      setWebhookUrl(web);
      if (web) setShowWebhook(true);
      setLabels(lab);
      setInitialState({ recipient: rec, webhookUrl: web, labels: lab });
    });
  }, []);

  const hasChanges = useMemo(() => {
    if (!initialState) return false;
    if (recipient !== initialState.recipient) return true;
    if (webhookUrl !== initialState.webhookUrl) return true;
    for (const key of Object.keys(labels) as Array<keyof ReportLabels>) {
      if (labels[key] !== initialState.labels[key]) return true;
    }
    return false;
  }, [recipient, webhookUrl, labels, initialState]);

  const handleRecipientChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientError(false);
    setRecipient(e.target.value);
  }, []);

  const handleWebhookChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWebhookError(false);
    setWebhookUrl(e.target.value);
  }, []);

  const handleLabelChange = useCallback(
    (field: keyof ReportLabels) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setLabels((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

  const handleResetLabels = useCallback(() => {
    setLabels({ ...DEFAULT_LABELS });
  }, []);

  const toggleWebhook = useCallback(() => setShowWebhook((v) => !v), []);
  const toggleLabels = useCallback(() => setShowLabels((v) => !v), []);

  const handleSave = useCallback(async () => {
    let hasError = false;

    const cleanedRecipient = recipient.replace(/\s/g, "");
    if (cleanedRecipient && !PHONE_REGEX.test(cleanedRecipient)) {
      setRecipientError(true);
      hasError = true;
    }

    const cleanedWebhook = webhookUrl.trim();
    if (cleanedWebhook && !URL_REGEX.test(cleanedWebhook)) {
      setWebhookError(true);
      hasError = true;
    }

    if (hasError) return;

    const customLabels: Partial<ReportLabels> = {};
    (Object.keys(labels) as Array<keyof ReportLabels>).forEach((key) => {
      if (labels[key] !== DEFAULT_LABELS[key]) {
        customLabels[key] = labels[key];
      }
    });

    const settings: AppSettings = {
      recipient: cleanedRecipient,
      ...(cleanedWebhook ? { senderWebhookUrl: cleanedWebhook } : {}),
      ...(Object.keys(customLabels).length > 0 ? { labels: customLabels } : {}),
    };

    await setItem(STORAGE_KEYS.SETTINGS, settings);
    setInitialState({ recipient: cleanedRecipient, webhookUrl: cleanedWebhook, labels });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [recipient, webhookUrl, labels]);

  const labelFields: { key: keyof ReportLabels; placeholder: string }[] = [
    { key: "title", placeholder: DEFAULT_LABELS.title },
    { key: "os", placeholder: DEFAULT_LABELS.os },
    { key: "client", placeholder: DEFAULT_LABELS.client },
    { key: "date", placeholder: DEFAULT_LABELS.date },
    { key: "periods", placeholder: DEFAULT_LABELS.periods },
    { key: "description", placeholder: DEFAULT_LABELS.description },
  ];

  return (
    <Box sx={{ pb: 10 }}>
      <Stack spacing={3}>
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
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h5" fontWeight={700}>
                Configurações
              </Typography>
              {saved && (
                <Alert severity="success" variant="filled" sx={{ py: 0, '& .MuiAlert-message': { py: 0.5 } }}>
                  Salvo!
                </Alert>
              )}
            </Stack>
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!hasChanges}
              sx={{ flexShrink: 0 }}
            >
              Salvar
            </Button>
          </Stack>
        </Box>

        {currentUser && (
          <Paper variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, borderRadius: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "1.2rem",
              }}
            >
              {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "U"}
            </Box>
            <Stack>
              <Typography variant="subtitle1" fontWeight={700}>
                {currentUser.displayName || "Conta Sincronizada"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser.email}
              </Typography>
            </Stack>
          </Paper>
        )}

        {/* Destinatário */}
        <Stack spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Número de Destino (WhatsApp)
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Formato internacional: +5500987654321
          </Typography>
          <TextField
            value={recipient}
            onChange={handleRecipientChange}
            placeholder="+5500987654321"
            error={recipientError}
            helperText={
              recipientError ? "Formato inválido. Use apenas números (7–15 dígitos), com ou sem +" : undefined
            }
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        <Divider />

        {/* Remetente via Webhook (opcional) */}
        <Stack spacing={1} sx={{ opacity: recipient ? 1 : 0.5, pointerEvents: recipient ? "auto" : "none" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <LinkIcon color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>
                Remetente via WhatsApp Próprio (Experimental)
              </Typography>
            </Stack>
            <Tooltip title={!recipient ? "Preencha um destinatário primeiro" : showWebhook ? "Ocultar" : "Configurar"}>
              <span>
                <IconButton size="small" onClick={toggleWebhook} disabled={!recipient}>
                  {showWebhook ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Collapse in={showWebhook}>
            <Stack spacing={1.5} pt={0.5}>
              <Typography variant="body2" color="text.secondary">
                Configure uma URL de webhook para enviar mensagens via uma conta WhatsApp própria
                (ex: servidor local com <strong>whatsapp-web.js</strong> ou <strong>Baileys</strong>).
                Se não configurado, os registros serão enviados via link <em>wa.me</em>.
              </Typography>
              <Typography variant="body2" color="text.disabled" fontFamily="monospace" fontSize="0.75rem">
                POST {"{webhookUrl}"} → {"{ recipient: string, message: string }"}
              </Typography>
              <TextField
                label="URL do Webhook (opcional)"
                value={webhookUrl}
                onChange={handleWebhookChange}
                placeholder="http://localhost:3000/send"
                error={webhookError}
                helperText={webhookError ? "URL inválida. Deve começar com http:// ou https://" : undefined}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>
          </Collapse>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <LabelIcon color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>
                Etiquetas da Mensagem
              </Typography>
            </Stack>
            <Tooltip title={showLabels ? "Ocultar" : "Personalizar"}>
              <IconButton size="small" onClick={toggleLabels}>
                {showLabels ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Stack>

          <Collapse in={showLabels}>
            <Stack spacing={1.5} pt={0.5}>
              <Typography variant="body2" color="text.secondary">
                Personalize os índices exibidos na mensagem enviada ao WhatsApp.
              </Typography>
              {labelFields.map(({ key, placeholder }) => (
                <TextField
                  key={key}
                  label={`Etiqueta: "${placeholder}"`}
                  value={labels[key]}
                  onChange={handleLabelChange(key)}
                  placeholder={placeholder}
                  size="small"
                  fullWidth
                />
              ))}
              <Button size="small" variant="text" color="inherit" onClick={handleResetLabels}>
                Restaurar padrões
              </Button>
            </Stack>
          </Collapse>
        </Stack>
      </Stack>

      <Divider sx={{ my: 4 }} />
      <Button
        variant="outlined"
        color="error"
        startIcon={<LogoutIcon />}
        onClick={async () => {
          if (confirm("Deseja sair da sua conta?")) {
            await signOut(auth);
          }
        }}
        fullWidth
        sx={{ py: 1.5, mb: 10 }}
      >
        Sair da Conta
      </Button>
    </Box>
  );
}
