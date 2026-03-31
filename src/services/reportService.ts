import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { ReportFormData, SavedReport, ReportStatus } from "../types/report";

function getCollectionRef() {
  const user = auth.currentUser;
  if (!user) throw new Error("Não autenticado");
  return collection(db, "users", user.uid, "reports");
}

function getDocRef(id: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Não autenticado");
  return doc(db, "users", user.uid, "reports", id);
}

function toSavedReport(id: string, data: Record<string, unknown>): SavedReport {
  return {
    id,
    os: data.os as string,
    client: data.client as string,
    date: data.date as string,
    timeBlocks: (data.timeBlocks as SavedReport["timeBlocks"]) ?? [],
    description: data.description as string,
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
    sentAt: data.sentAt ? (data.sentAt as Timestamp).toDate().toISOString() : null,
    status: (data.status as ReportStatus) || (data.sentAt ? "sent" : "draft"),
  };
}

export async function saveReport(formData: ReportFormData, status: ReportStatus = "draft"): Promise<string> {
  const ref = await addDoc(getCollectionRef(), {
    ...formData,
    createdAt: serverTimestamp(),
    sentAt: null,
    status,
  });
  return ref.id;
}

export async function updateReport(id: string, formData: ReportFormData, status?: ReportStatus): Promise<void> {
  const changes: Record<string, unknown> = { ...formData };
  if (status) changes.status = status;
  await updateDoc(getDocRef(id), changes);
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<void> {
  const changes: Record<string, unknown> = { status };
  if (status === "sent") {
    changes.sentAt = serverTimestamp();
  }
  await updateDoc(getDocRef(id), changes);
}

export async function deleteReport(id: string): Promise<void> {
  await deleteDoc(getDocRef(id));
}

export async function listReports(): Promise<SavedReport[]> {
  const q = query(getCollectionRef(), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toSavedReport(d.id, d.data() as Record<string, unknown>));
}

export function subscribeReports(callback: (reports: SavedReport[]) => void): Unsubscribe {
  // try-catch or null check handled inside getCollectionRef but might throw synchronusly. 
  // It's safer to check first.
  if (!auth.currentUser) {
    callback([]);
    return () => {}; // dummy unsubscribe
  }
  
  const q = query(getCollectionRef(), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map((d) => toSavedReport(d.id, d.data() as Record<string, unknown>));
    callback(reports);
  });
}
