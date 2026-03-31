export interface TimeBlock {
  id: string;
  start: string;
  end: string;
}

export interface ReportFormData {
  os: string;
  client: string;
  date: string;
  timeBlocks: TimeBlock[];
  description: string;
}

export type ReportStatus = "draft" | "pending" | "sent";

export interface SavedReport extends ReportFormData {
  id: string;
  createdAt: string;
  sentAt: string | null;
  status: ReportStatus;
}

export interface ReportLabels {
  title: string;
  os: string;
  client: string;
  date: string;
  periods: string;
  description: string;
}

export interface AppSettings {
  recipient: string;
  senderWebhookUrl?: string;
  labels?: Partial<ReportLabels>;
}

export const DEFAULT_LABELS: ReportLabels = {
  title: "Atendimento",
  os: "Ordem de Serviço",
  client: "Cliente",
  date: "Data",
  periods: "Horário",
  description: "Descrição",
};
