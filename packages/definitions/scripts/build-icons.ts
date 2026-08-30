import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(here, '..', 'icons');
const outFile = join(here, '..', 'src', 'icons.generated.ts');

const toDataUri = (svg: string): string =>
  `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;

const entries = readdirSync(iconsDir)
  .filter((file) => file.endsWith('.svg'))
  .sort()
  .map((file) => {
    const slug = basename(file, '.svg');
    const uri = toDataUri(readFileSync(join(iconsDir, file), 'utf8'));
    return `  '${slug}': '${uri}',`;
  });

const output = `export const iconDataUris = {
${entries.join('\n')}
} as const satisfies Record<string, string>;

export type IconSlug = keyof typeof iconDataUris;
`;

writeFileSync(outFile, output, 'utf8');
console.log(`icons.generated.ts — ${entries.length} iconos embebidos`);
