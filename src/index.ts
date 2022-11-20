import fs from 'fs';
import { promisify } from 'util';
import { Plugin, ExistingRawSourceMap } from 'rollup';
import { CreateFilter, createFilter } from '@rollup/pluginutils';
import atob from 'atob';
import * as urlLib from 'url';
import decodeUriComponentLib from 'decode-uri-component';

interface ResolvedSourceMap {
  map: ExistingRawSourceMap;
  url: string | null;
  sourcesRelativeTo: string;
  sourceMappingURL: string;
}

function resolveUrl(...args: string[]): string {
  return args.reduce((resolved, nextUrl) => urlLib.resolve(resolved, nextUrl));
}

function customDecodeUriComponent(string: string): string {
  return decodeUriComponentLib(string.replace(/\+/g, '%2B'));
}

function parseMapToJSON(string: string): ExistingRawSourceMap {
  return <ExistingRawSourceMap>JSON.parse(string.replace(/^\)\]\}'/, ''));
}

const sourceMappingURLRegex = RegExp(
  '(?:/\\*(?:\\s*\\r?\\n(?://)?)?(?:[#@] sourceMappingURL=([^\\s\'"]*))\\s*\\*/|//(?:[#@] sourceMappingURL=([^\\s\'"]*)))\\s*',
);

function getSourceMappingUrl(code: string): string | null {
  const match = sourceMappingURLRegex.exec(code);
  return match ? match[1] || match[2] || '' : null;
}

async function resolveSourceMap(
  code: string,
  codeUrl: string,
  read: (path: string) => Promise<Buffer | string>,
): Promise<ResolvedSourceMap | null> {
  const sourceMappingURL = getSourceMappingUrl(code);
  if (!sourceMappingURL) {
    return null;
  }
  const dataUri = /^data:([^,;]*)(;[^,;]*)*(?:,(.*))?$/.exec(sourceMappingURL);
  if (dataUri) {
    const mimeType = dataUri[1] || 'text/plain';
    if (!/^(?:application|text)\/json$/.test(mimeType)) {
      throw new Error('Unuseful data uri mime type: ' + mimeType);
    }
    const map = parseMapToJSON(
      (dataUri[2] === ';base64' ? atob : decodeURIComponent)(dataUri[3] || ''),
    );
    return { sourceMappingURL, url: null, sourcesRelativeTo: codeUrl, map };
  }
  const url = resolveUrl(codeUrl, sourceMappingURL);
  const map = parseMapToJSON(String(await read(customDecodeUriComponent(url))));
  return { sourceMappingURL, url, sourcesRelativeTo: url, map };
}

interface ResolvedSources {
  sourcesResolved: string[];
  sourcesContent: (string | Error)[];
}

async function resolveSources(
  map: ExistingRawSourceMap,
  mapUrl: string,
  read: (path: string) => Promise<Buffer | string>,
): Promise<ResolvedSources> {
  const sourcesResolved: string[] = [];
  const sourcesContent: (string | Error)[] = [];
  for (let index = 0, len = map.sources.length; index < len; index++) {
    const sourceRoot = map.sourceRoot;
    const sourceContent = (map.sourcesContent || [])[index];
    const resolvePaths = [mapUrl, map.sources[index]];
    if (sourceRoot !== undefined && sourceRoot !== '') {
      resolvePaths.splice(1, 0, sourceRoot.replace(/\/?$/, '/'));
    }
    sourcesResolved[index] = resolveUrl(...resolvePaths);
    if (typeof sourceContent === 'string') {
      sourcesContent[index] = sourceContent;
      continue;
    }
    try {
      const source = await read(customDecodeUriComponent(sourcesResolved[index]));
      sourcesContent[index] = String(source);
    } catch (error) {
      sourcesContent[index] = <Error>error;
    }
  }
  return { sourcesResolved, sourcesContent };
}

export interface SourcemapsPluginOptions {
  include?: Parameters<CreateFilter>[0];
  exclude?: Parameters<CreateFilter>[1];
  readFile?(path: string, callback: (error: Error | null, data: Buffer | string) => void): void;
}

export default function sourcemaps({
  include,
  exclude,
  readFile = fs.readFile,
}: SourcemapsPluginOptions = {}): Plugin {
  const filter = createFilter(include, exclude);
  const promisifiedReadFile = promisify(readFile);

  return {
    name: 'sourcemaps',

    async load(id: string) {
      if (!filter(id)) {
        return null;
      }

      let code: string;
      try {
        code = (await promisifiedReadFile(id)).toString();
      } catch {
        this.warn('Failed reading file');
        return null;
      }

      let map: ExistingRawSourceMap;
      try {
        const result = await resolveSourceMap(code, id, promisifiedReadFile);

        // The code contained no sourceMappingURL
        if (result === null) {
          return code;
        }

        map = result.map;
      } catch {
        this.warn('Failed resolving source map');
        return code;
      }

      // Resolve sources if they're not included
      if (map.sourcesContent === undefined) {
        try {
          const { sourcesContent } = await resolveSources(map, id, promisifiedReadFile);
          if (sourcesContent.every(item => typeof item === 'string')) {
            map.sourcesContent = sourcesContent as string[];
          }
        } catch {
          this.warn('Failed resolving sources for source map');
        }
      }

      return { code, map };
    },
  };
}
