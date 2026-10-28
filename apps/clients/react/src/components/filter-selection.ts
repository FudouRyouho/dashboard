/**
 * Modelo de selección del filtro, separado del componente para que el archivo del
 * componente sólo exporte componentes (fast refresh) y para que el predicado de
 * "hay filtro activo" sea importable sin arrastrar la superficie.
 */

export interface FilterOption {
  /** Valor estable que consume el predicado, ej. `running`. */
  value: string;
  /** Etiqueta legible. Suele coincidir con `value`. */
  label: string;
  /** Color del estado: mismo token que el badge de la fila. Sin color = neutro. */
  color?: string;
}

export interface FilterDimension {
  /** Nombre de la dimensión, ej. `State`. */
  label: string;
  /**
   * Universo completo del contract, no sólo los valores presentes en la data:
   * filtrar nunca cambia qué se puede elegir.
   */
  options: FilterOption[];
}

/** Una dimensión → un valor activo, o nada. Ausente = todos. */
export type FilterSelection = Record<string, string | undefined>;

/** Un valor definido en cualquier dimensión = el filtro está activo (lo que nota el glyph). */
export function isFilterActive(selection: FilterSelection): boolean {
  return Object.values(selection).some((value) => value !== undefined);
}
