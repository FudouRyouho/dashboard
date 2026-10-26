import { useState } from 'react';

import type { IntegrationOutput } from '../../mock/integrations.mock';

/** Emulated write state: rows are mutated locally, shape-validated before commit. */
export function useIntegrationsState(initial: IntegrationOutput[]) {
  const [rows, setRows] = useState<IntegrationOutput[]>(initial);

  const upsert = (next: IntegrationOutput) => {
    // Contract input validation already happened in the edit modal
    // (upsertIntegrationInputSchema.safeParse); here the row is in OUTPUT shape.
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === next.id);
      return idx === -1 ? [...prev, next] : prev.map((r) => (r.id === next.id ? next : r));
    });
  };

  const remove = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return { rows, upsert, remove };
}
