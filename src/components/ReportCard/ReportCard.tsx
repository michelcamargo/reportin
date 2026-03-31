import { useCallback } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Stack,
  Typography,
  Tooltip,
  Checkbox,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { format } from "date-fns";
import EditIcon from "@mui/icons-material/Edit";
import { ptBR } from "date-fns/locale";
import type { SavedReport } from "../../types/report";

interface Props {
  report: SavedReport;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onResend: (report: SavedReport) => void;
  onEdit: (report: SavedReport) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string) {
  try {
    return format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string) {
  try {
    return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function ReportCard({ report, selected, onSelect, onResend, onEdit, onDelete }: Props) {
  const { status } = report;
  const isSent = status === "sent";
  const isPending = status === "pending";
  const isDraft = status === "draft";

  const handleResend = useCallback(() => {
    onResend(report);
  }, [onResend, report]);

  const handleEdit = useCallback(() => {
    onEdit(report);
  }, [onEdit, report]);

  const handleDelete = useCallback(() => {
    onDelete(report.id);
  }, [onDelete, report.id]);

  const handleToggleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSelect?.(report.id, e.target.checked);
    },
    [onSelect, report.id]
  );

  return (
    <Card
      variant="outlined"
      sx={{
        borderLeft: 4,
        borderLeftColor: isSent ? "success.main" : isPending ? "warning.main" : "text.disabled",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: 4 },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Stack direction="row" alignItems="center">
            {onSelect && (
              <Checkbox
                checked={!!selected}
                onChange={handleToggleSelect}
                sx={{ p: 0, mr: 1.5 }}
              />
            )}
            <Stack>
              <Typography variant="subtitle1" fontWeight={700}>
                OS: {report.os}
              </Typography>
              {report.client && (
                <Typography variant="body2" color="text.secondary">
                  {report.client}
                </Typography>
              )}
            </Stack>
          </Stack>

          <Chip
            size="small"
            icon={isSent ? <CheckCircleIcon /> : isPending ? <AccessTimeIcon /> : <RadioButtonUncheckedIcon />}
            label={isSent ? "Enviado" : isPending ? "Pendente" : "Rascunho"}
            color={isSent ? "success" : isPending ? "warning" : "default"}
            variant={isDraft ? "outlined" : "filled"}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Data: {formatDate(report.date)}
        </Typography>

        {report.timeBlocks.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Períodos:{" "}
            {report.timeBlocks.map((b) => `${b.start} a ${b.end}`).join(", ")}
          </Typography>
        )}

        {isSent && (
          <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: "block" }}>
            Enviado em {formatDateTime(report.sentAt!)}
          </Typography>
        )}

        {!isSent && (
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
            Criado em {formatDateTime(report.createdAt)}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
        {!isSent && (
          <Tooltip title="Continuar Edição">
            <IconButton size="small" color="primary" onClick={handleEdit}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Reenviar via WhatsApp">
          <IconButton size="small" color="success" onClick={handleResend}>
            <WhatsAppIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir registro">
          <IconButton size="small" color="error" onClick={handleDelete}>
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
