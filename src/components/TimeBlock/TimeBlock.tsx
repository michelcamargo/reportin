import { useCallback } from "react";
import { IconButton, Stack, Typography, Box } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { format } from "date-fns";
import type { TimeBlock as TimeBlockType } from "../../types/report";
import { validateTimeBlock } from "../../utils/validation";

interface Props {
  block: TimeBlockType;
  index: number;
  reportDate: string;
  canRemove: boolean;
  onChange: (id: string, field: "start" | "end", value: string) => void;
  onRemove: (id: string) => void;
}

function timeStringToDate(timeStr: string): Date | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function dateToTimeString(date: Date | null): string {
  if (!date) return "";
  return format(date, "HH:mm");
}

export function TimeBlock({ block, index, reportDate, canRemove, onChange, onRemove }: Props) {
  const errorMsg = validateTimeBlock(block, reportDate, false);
  const timeError = errorMsg !== null;

  const handleStartChange = useCallback(
    (date: Date | null) => onChange(block.id, "start", dateToTimeString(date)),
    [block.id, onChange]
  );

  const handleEndChange = useCallback(
    (date: Date | null) => onChange(block.id, "end", dateToTimeString(date)),
    [block.id, onChange]
  );

  const handleSetNowStart = useCallback(
    () => onChange(block.id, "start", format(new Date(), "HH:mm")),
    [block.id, onChange]
  );

  const handleSetNowEnd = useCallback(
    () => onChange(block.id, "end", format(new Date(), "HH:mm")),
    [block.id, onChange]
  );

  const handleRemove = useCallback(() => onRemove(block.id), [block.id, onRemove]);

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: timeError ? "error.main" : "action.hover",
          flexWrap: "wrap",
          gap: 1,
          opacity: timeError ? 0.95 : 1,
          border: timeError ? "1px solid" : "none",
          borderColor: timeError ? "error.main" : "transparent",
          transition: "background-color 0.2s",
        }}
      >
        <Typography
          variant="body2"
          color={timeError ? "error.contrastText" : "text.secondary"}
          sx={{ minWidth: 24, fontWeight: 600 }}
        >
          {index + 1}.
        </Typography>

        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flex: 1, minWidth: 120 }}>
          <TimePicker
            label="Início"
            value={timeStringToDate(block.start)}
            onChange={handleStartChange}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                error: timeError,
              },
            }}
            ampm={false}
          />
          <IconButton size="small" onClick={handleSetNowStart} title="Agora">
            <AccessTimeIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flex: 1, minWidth: 120 }}>
          <TimePicker
            label="Término"
            value={timeStringToDate(block.end)}
            onChange={handleEndChange}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                error: timeError,
              },
            }}
            ampm={false}
          />
          <IconButton size="small" onClick={handleSetNowEnd} title="Agora">
            <AccessTimeIcon fontSize="small" />
          </IconButton>
        </Stack>

        <IconButton
          onClick={handleRemove}
          color={timeError ? "inherit" : "error"}
          size="small"
          disabled={!canRemove}
          sx={{ opacity: canRemove ? 1 : 0.3 }}
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Stack>

      {timeError && (
        <Typography variant="caption" color="error" sx={{ pl: 1.5, display: "block", mt: 0.25 }}>
          {errorMsg}
        </Typography>
      )}
    </Box>
  );
}
