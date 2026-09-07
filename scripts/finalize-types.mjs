import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function declarations(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await declarations(path));
    else if (path.endsWith('.d.ts')) paths.push(path);
  }
  return paths;
}

// 两种运行时入口分别提供匹配的声明格式，兼容 NodeNext 和 Bundler。
const relativeSpecifier = /(['"])(\.{1,2}\/[^'"]+)\1/g;
const typesDirectory = fileURLToPath(new URL('../dist/types/', import.meta.url));
for (const path of await declarations(typesDirectory)) {
  const source = await readFile(path, 'utf8');
  const cjs = source.replace(relativeSpecifier, (_, quote, specifier) =>
    quote + (specifier.endsWith('.vue') ? specifier + '.js' : specifier) + quote);
  const esm = cjs.replace(relativeSpecifier, (_, quote, specifier) =>
    quote + specifier.replace(/\.js$/, '.mjs') + quote);
  await writeFile(path, cjs);
  await writeFile(path.replace(/\.d\.ts$/, '.d.mts'), esm);
}
