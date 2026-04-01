import { useCallback, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Box,
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

  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleCardClick = useCallback(() => {
    setDetailsOpen(true);
  }, []);

  const handleCloseDetails = useCallback((e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setDetailsOpen(false);
  }, []);

  const handleResend = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onResend(report);
    },
    [onResend, report]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(report);
    },
    [onEdit, report]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(report.id);
    },
    [onDelete, report.id]
  );

  const handleToggleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onSelect?.(report.id, e.target.checked);
    },
    [onSelect, report.id]
  );

    <>
      <Card
        variant="outlined"
        onClick={handleCardClick}
        sx={{
          borderLeft: 4,
          borderLeftColor: isSent ? "success.main" : isPending ? "warning.main" : "text.disabled",
          transition: "box-shadow 0.2s",
          cursor: "pointer",
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

      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth onClick={(e) => e.stopPropagation()}>
        <DialogTitle sx={{ fontWeight: 700 }}>Detalhes do Laudo</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip
                size="small"
                icon={isSent ? <CheckCircleIcon /> : isPending ? <AccessTimeIcon /> : <RadioButtonUncheckedIcon />}
                label={isSent ? "Enviado" : isPending ? "Pendente" : "Rascunho"}
                color={isSent ? "success" : isPending ? "warning" : "default"}
                variant={isDraft ? "outlined" : "filled"}
              />
            </Stack>
            <Divider />

            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                OS
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {report.os}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Cliente
              </Typography>
              <Typography variant="body1">{report.client || "—"}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Data do Serviço
              </Typography>
              <Typography variant="body1">{formatDate(report.date)}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Períodos
              </Typography>
              {report.timeBlocks.length > 0 ? (
                <Stack>
                  {report.timeBlocks.map((b, i) => (
                    <Typography key={i} variant="body2">
                      • {b.start} a {b.end}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2">—</Typography>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Descrição / Serviços Realizados
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                {report.description || "—"}
              </Typography>
            </Box>

            <Box>
              {isSent && (
                <Typography variant="caption" color="success.main" display="block">
                  Enviado em {formatDateTime(report.sentAt!)}
                </Typography>
              )}
              <Typography variant="caption" color="text.disabled" display="block">
                Criado em {formatDateTime(report.createdAt)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} color="inherit">
            Fechar
          </Button>
          {!isSent && (
            <Button
              onClick={(e) => {
                handleCloseDetails(e);
                handleEdit(e);
              }}
              color="primary"
            >
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
