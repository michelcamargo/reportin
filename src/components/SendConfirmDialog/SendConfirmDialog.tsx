import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PersonIcon from "@mui/icons-material/Person";
import MessageIcon from "@mui/icons-material/Message";

interface Props {
  open: boolean;
  recipient: string;
  messagePreview: string;
  onConfirm: () => void;
  onCancel: () => void;
  sending: boolean;
}

export function SendConfirmDialog({
  open,
  recipient,
  messagePreview,
  onConfirm,
  onCancel,
  sending,
}: Props) {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WhatsAppIcon color="success" />
        Confirmar Envio
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Destinatário
              </Typography>
            </Stack>
            {recipient ? (
              <Chip
                label={`+${recipient.replace(/^\+/, "")}`}
                color="success"
                variant="outlined"
                size="small"
                icon={<WhatsAppIcon />}
              />
            ) : (
              <Chip
                label="Escolher no WhatsApp"
                color="default"
                variant="outlined"
                size="small"
                icon={<WhatsAppIcon />}
              />
            )}
          </Box>

          <Divider />

          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <MessageIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Mensagem
              </Typography>
            </Stack>
            <Box
              sx={{
                bgcolor: "action.hover",
                borderRadius: 2,
                p: 1.5,
                fontFamily: "monospace",
                fontSize: "0.8rem",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                maxHeight: 300,
                overflowY: "auto",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {messagePreview}
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onCancel} variant="outlined" color="inherit" disabled={sending}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="success"
          startIcon={<WhatsAppIcon />}
          disabled={sending}
          autoFocus
        >
          {sending ? "Enviando..." : "Confirmar e Enviar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
