import fs from 'fs';
import util from 'util';
import { Plugin, ExistingRawSourceMap } from 'rollup';
import { createFilter, CreateFilter } from 'rollup-pluginutils';
import { resolveSourceMap, resolveSources } from 'source-map-resolve';

const promisifiedResolveSourceMap = util.promisify(resolveSourceMap);
const promisifiedResolveSources = util.promisify(resolveSources);

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
  const promisifiedReadFile = util.promisify(readFile);

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
        // Failed reading file, let the next plugin deal with it
        return null;
      }

      let map: ExistingRawSourceMap;
      try {
        const result = await promisifiedResolveSourceMap(code, id, readFile);

        // The code contained no sourceMappingURL,
        if (result === null) {
          return code;
        }

        map = result.map;
      } catch {
        // Failed resolving source map, just return the source
        return code;
      }

      // Resolve sources if they're not included
      if (map.sourcesContent === undefined) {
        try {
          const { sourcesContent } = await promisifiedResolveSources(map, id, readFile);
          if (sourcesContent.every(util.isString)) {
            map.sourcesContent = sourcesContent as string[];
          }
        } catch {
          // Ignore
        }
      }

      return { code, map };
    },
  };
}
