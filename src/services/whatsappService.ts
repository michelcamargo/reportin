import type { ReportFormData, AppSettings, ReportLabels } from "../types/report";
import { DEFAULT_LABELS } from "../types/report";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const BASE_URL = "https://wa.me";

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

function resolveLabels(labels?: Partial<ReportLabels>): ReportLabels {
  return { ...DEFAULT_LABELS, ...labels };
}

export function buildMessage(formData: ReportFormData, labels?: Partial<ReportLabels>): string {
  const l = resolveLabels(labels);

// REMOVIDO PARA CRIAR DINAMICAMENTE ABAIXO

  const lines: string[] = [];

  // Título
  if (l.title && l.title.trim() !== "") {
    lines.push(`*${l.title.trim()}*`);
  }

  // Label inline condicional
  const addInline = (label: string, value: string) => {
    if (label && label.trim() !== "") {
      lines.push(`*${label.trim()}:* ${value}`);
    } else {
      lines.push(value);
    }
  };

  const clientLabelEmpty = !l.client || l.client.trim() === "";

  if (clientLabelEmpty) {
    const osLineInfo = (!l.os || l.os.trim() === "")
      ? formData.os
      : `*${l.os.trim()}:* ${formData.os}`;
      
    lines.push(formData.client ? `${osLineInfo} - ${formData.client}` : osLineInfo);
  } else {
    addInline(l.os, formData.os);
    addInline(l.client, formData.client || "—");
  }

  let dateValue = formatDate(formData.date);
  const periodsLabelEmpty = !l.periods || l.periods.trim() === "";

  if (periodsLabelEmpty && formData.timeBlocks.length === 1) {
    dateValue += `, ${formData.timeBlocks[0].start} a ${formData.timeBlocks[0].end}`;
  }

  addInline(l.date, dateValue);

  // Label de bloco (períodos)
  if (!(periodsLabelEmpty && formData.timeBlocks.length === 1)) {
    if (!periodsLabelEmpty) {
      lines.push(""); // Add empty line if there's a title
      lines.push(`*${l.periods.trim()}:*`);
    }

    const periods = formData.timeBlocks
      .map((b) => `* ${b.start} a ${b.end}`)
      .join("\n");
      
    lines.push(periods || "* —");
  }
  
  lines.push("");

  // Label de bloco (descrição)
  if (l.description && l.description.trim() !== "") {
    lines.push(`*${l.description.trim()}:*`);
  }
  lines.push(formData.description || "—");

  return lines.join("\n");
}

export function buildWhatsAppLink(formData: ReportFormData, settings: AppSettings): string {
  const recipient = settings.recipient ? settings.recipient.replace(/\D/g, "") : "";
  const message = buildMessage(formData, settings.labels);
  const path = recipient ? `/${recipient}` : "";
  return `${BASE_URL}${path}?text=${encodeURIComponent(message)}`;
}

export async function sendViaWebhook(
  webhookUrl: string,
  formData: ReportFormData,
  settings: AppSettings
): Promise<void> {
  const message = buildMessage(formData, settings.labels);
  const recipient = settings.recipient.replace(/\D/g, "");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient, message }),
  });

  if (!response.ok) {
    throw new Error(`Erro no envio via webhook: ${response.status} ${response.statusText}`);
  }
}
