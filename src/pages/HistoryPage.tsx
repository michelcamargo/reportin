import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Button,
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ReportCard } from "../components/ReportCard/ReportCard";
import { subscribeReports, updateReportStatus, deleteReport, buildWhatsAppLink } from "../services";
import { getItem } from "../services";
import { STORAGE_KEYS } from "../constants/storage-keys";
import type { SavedReport, AppSettings } from "../types/report";

type Filter = "all" | "sent" | "pending" | "draft";

export function HistoryPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeReports((data) => {
      setReports(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleResend = useCallback(async (report: SavedReport) => {
    const settings = await getItem<AppSettings>(STORAGE_KEYS.SETTINGS);
    if (!settings?.recipient) {
      alert("Configure o número de destino em Configurações.");
      return;
    }
    const link = buildWhatsAppLink(report, settings);
    window.open(link, "_blank");
    await updateReportStatus(report.id, "sent");
  }, []);

  const handleEdit = useCallback(
    (report: SavedReport) => {
      navigate("/", { state: { editReport: report } });
    },
    [navigate]
  );

  const handleDelete = useCallback(async (id: string) => {
    if (confirm("Deseja excluir este registro?")) {
      await deleteReport(id);
    }
  }, []);

  const handleFilterChange = useCallback((_: React.MouseEvent<HTMLElement>, value: Filter | null) => {
    if (value) {
      setFilter(value);
      setSelectedIds(new Set());
    }
  }, []);

  const handleToggleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (confirm(`Deseja excluir permanentemente os ${selectedIds.size} registro(s)?`)) {
      await Promise.all(Array.from(selectedIds).map((id) => deleteReport(id)));
      setSelectedIds(new Set());
    }
  }, [selectedIds]);

  const filtered = reports.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  return (
    <Box sx={{ pb: 10 }}>
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
          {selectedIds.size > 0 ? (
            <Stack direction="row" justifyContent="space-between" alignItems="center" minHeight={40} gap={1} flexWrap="wrap">
              <Typography variant="subtitle1" fontWeight={700} color="error.main">
                {selectedIds.size} selecionado(s)
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => setSelectedIds(new Set())} color="inherit">
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  size="small" 
                  startIcon={<DeleteOutlineIcon />} 
                  onClick={handleBulkDelete}
                >
                  Excluir
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap" minHeight={40}>
              <Typography variant="h5" fontWeight={700}>
                Histórico
              </Typography>
              <ToggleButtonGroup
                value={filter}
                exclusive
                onChange={handleFilterChange}
                size="small"
                sx={{ bgcolor: "background.paper" }}
              >
                <ToggleButton value="all">Todos</ToggleButton>
                <ToggleButton value="sent">Enviados</ToggleButton>
                <ToggleButton value="pending">Pendentes</ToggleButton>
                <ToggleButton value="draft">Rascunhos</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          )}
        </Box>

        {loading && (
          <Stack spacing={1.5}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={100} />
            ))}
          </Stack>
        )}

        {!loading && filtered.length === 0 && (
          <Stack alignItems="center" spacing={2} py={6}>
            <ArticleOutlinedIcon sx={{ fontSize: 64, color: "text.disabled" }} />
            <Typography color="text.secondary">Nenhum registro encontrado.</Typography>
          </Stack>
        )}

        <Stack spacing={1.5}>
          {filtered.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              selected={selectedIds.has(report.id)}
              onSelect={handleToggleSelect}
              onResend={handleResend}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
