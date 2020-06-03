import { promises as fs } from 'fs';
import url from 'url';

const innerRegex = /[#@] sourceMappingURL=([^\s'"]*)/;
const sourceMappingUrlRegex = RegExp(
  `(?:/\\*(?:\\s*\r?\n(?://)?)?(?:${innerRegex.source})\\s*\\*/|//(?:${innerRegex.source}))\\s*`,
);

export function getSourceMappingURL(code: string) {
  const match = sourceMappingUrlRegex.exec(code);
  return match?.[1] ?? match?.[2];
}

export function tryParseDataUri(dataUri: string) {
  if (!dataUri.startsWith('data:')) {
    return undefined;
  }

  const body = dataUri.slice(dataUri.indexOf(',') + 1);

  return Buffer.from(body, 'base64').toString('utf8');
}

export function resolvePath(path: string, base?: string) {
  return url.fileURLToPath(
    base === undefined ? url.pathToFileURL(path) : new URL(path, url.pathToFileURL(base)),
  );
}

export function readFileAsString(path: string) {
  return fs.readFile(path, 'utf8');
}
