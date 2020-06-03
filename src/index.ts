import { Plugin, ExistingRawSourceMap } from 'rollup';
import pluginUtils, { CreateFilter } from '@rollup/pluginutils';

import { getSourceMappingURL, tryParseDataUri, resolvePath, readFileAsString } from './utils';

const { createFilter } = pluginUtils;

export interface SourcemapsPluginOptions {
  include?: Parameters<CreateFilter>[0];
  exclude?: Parameters<CreateFilter>[1];
  readFile?(path: string): Promise<string>;
}

export default function sourcemaps({
  include,
  exclude,
  readFile = readFileAsString,
}: SourcemapsPluginOptions = {}): Plugin {
  const filter = createFilter(include, exclude);

  async function loadFile(path: string, base?: string) {
    return tryParseDataUri(path) ?? (await readFile(resolvePath(path, base)));
  }

  return {
    name: 'sourcemaps',

    async load(id: string) {
      if (!filter(id)) {
        return null;
      }

      let code: string;
      try {
        code = await loadFile(id);
      } catch {
        this.warn('Failed reading file');
        return null;
      }

      const sourceMappingURL = getSourceMappingURL(code);

      // The code contained no sourceMappingURL
      if (sourceMappingURL === undefined) {
        return code;
      }

      let map: ExistingRawSourceMap;
      try {
        const rawSourceMap = await loadFile(sourceMappingURL, id);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        map = JSON.parse(rawSourceMap);
      } catch {
        this.warn('Failed loading source map');
        return code;
      }

      // Try resolving missing sources
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      map.sourcesContent = await Promise.all(
        map.sources.map(
          (source, index) => map.sourcesContent?.[index] ?? loadFile(source, id).catch(() => null),
        ),
      );

      return { code, map };
    },
  };
}
