/*
 * Pure TypeScript interfaces — zero runtime dependencies.
 * TestDb mirrors the Drizzle-like query builder surface used in tests.
 */
export interface TestDb {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
  query: (...args: any[]) => any;
  execute: (...args: any[]) => any;
}

/*
 * Type for a factory that creates a real DB instance.
 * Consumer packages (e.g. @dashboard/db) export their own withTempDb
 * helper that accepts this factory type.
 */
export type CreateDbFn = () => TestDb;