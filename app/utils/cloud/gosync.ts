import { STORAGE_KEY } from "@/app/constant";
import { SyncStore } from "@/app/store/sync";
import { chunks } from "../format";

export type GoSync = SyncStore["gosync"];
export type GoSyncClient = ReturnType<typeof createGoSyncClient>;

export function createGoSyncClient(store: SyncStore) {
  /** TODO */
  // Note: This my own sync writen in go, not yet ready
}
