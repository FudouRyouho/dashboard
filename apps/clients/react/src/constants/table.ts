/**
 * Table scroll floors — the minimum width of the container that holds a table.
 * Derived from the sum of fixed-column widths plus the non-truncatable elastic
 * columns (Name, Image). The scroll container must be at least this wide so the
 * table does not collapse below what its own columns demand.
 */
export const TABLE_MIN_WIDTH = {
  /** Downloads: Name(150) + Progress(120) + Size(80) + Down(90) + Up(90) + ETA(80) + State(90) */
  downloads: 700,
  /** Docker: Name(150) + State(100) + Host(120) + Image(150) + Created(100) + Status(140) */
  docker: 760,
} as const;