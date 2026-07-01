import AsyncStorage from "@react-native-async-storage/async-storage";
import { PrescriptionHistory } from "../types";

const HISTORY_KEY = "@prescription_history";

export async function savePrescription(history: PrescriptionHistory): Promise<void> {
  const existing = await getHistory();
  const updated = [history, ...existing].slice(0, 50);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function getHistory(): Promise<PrescriptionHistory[]> {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const existing = await getHistory();
  const updated = existing.filter((h) => h.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
