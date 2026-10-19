import { vi } from 'vitest';
import type { TestDb } from '../core/database';

export function createMockDb(): TestDb {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
  };
}
