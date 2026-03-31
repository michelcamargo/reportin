import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";

interface Props {
  open: boolean;
  onContinue: () => void;
  onDiscard: () => void;
}

export function DraftDialog({ open, onContinue, onDiscard }: Props) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <HistoryIcon color="primary" />
        Atendimento Pendente
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Existe um rascunho não enviado. Deseja continuar de onde parou ou iniciar um novo
          atendimento?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onDiscard} color="error" variant="outlined" fullWidth>
          Descartar
        </Button>
        <Button onClick={onContinue} variant="contained" fullWidth autoFocus>
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
