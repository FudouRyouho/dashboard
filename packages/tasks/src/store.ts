import type { DB } from '@dashboard/db';
import { getTaskSnapshot, upsertTaskSnapshot } from '@dashboard/db';
import type { Snapshot, SnapshotKey, SnapshotStore } from './types';

export function createSnapshotStoreDB(db: DB): SnapshotStore {
  return {
    get<T>(key: SnapshotKey<T>) {
      const row = getTaskSnapshot(db, key.taskId);
      if (!row) return undefined;
      return row as Snapshot<T>;
    },
    set<T>(key: SnapshotKey<T>, data: NoInfer<T>): void {
      upsertTaskSnapshot(db, key.taskId, data);
    },
  };
}
