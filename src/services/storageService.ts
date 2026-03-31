import { get, set, del } from "idb-keyval";

export async function getItem<T>(key: string): Promise<T | undefined> {
  return get<T>(key);
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await set(key, value);
}

export async function removeItem(key: string): Promise<void> {
  await del(key);
}
