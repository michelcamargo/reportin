import { isBefore, isAfter, parse } from "date-fns";
import type { TimeBlock as TimeBlockType } from "../types/report";

export function validateTimeBlock(block: TimeBlockType, reportDate: string, checkEmpty: boolean = false): string | null {
  if (!block.start || !block.end) {
    return checkEmpty ? "Preencha os horários de início e término." : null;
  }
  
  const base = new Date();
  const s = parse(block.start, "HH:mm", base);
  const e = parse(block.end, "HH:mm", base);
  
  if (isBefore(e, s) || (!isAfter(e, s) && e.getTime() !== s.getTime())) {
    return "O término não pode ser anterior ao início.";
  }

  // Verifica se a data do registro é igual ao dia atual. Se for, valida limite de hora.
  const formDate = new Date(reportDate);
  const formDateBase = new Date(formDate.getFullYear(), formDate.getMonth(), formDate.getDate());
  const todayBase = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  
  if (formDateBase.getTime() === todayBase.getTime() && isAfter(e, base)) {
    return "O término não pode ser maior que a hora atual.";
  }

  return null;
}
