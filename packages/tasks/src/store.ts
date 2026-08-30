export interface Snapshot<T> {
  data: T;
  obtainedAt: Date;
}

export interface SnapshotKey<T> {
  readonly taskId: string;
  readonly __data?: T;
}

export interface SnapshotStore {
  get<T>(key: SnapshotKey<T>): Snapshot<T> | undefined;
  set<T>(key: SnapshotKey<T>, data: NoInfer<T>): void;
}

export function createMemoryStore(): SnapshotStore {
  const map = new Map<string, Snapshot<unknown>>();

  return {
    get<T>(key: SnapshotKey<T>) {
      return map.get(key.taskId) as Snapshot<T> | undefined;
    },
    set<T>(key: SnapshotKey<T>, data: NoInfer<T>) {
      map.set(key.taskId, { data, obtainedAt: new Date() });
    },
  };
}
