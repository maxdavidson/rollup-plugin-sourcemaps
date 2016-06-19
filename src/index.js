/* eslint-disable no-console */
import { createFilter } from 'rollup-pluginutils';
import { resolveSourceMap } from 'source-map-resolve';
import { readFile } from 'fs';
import { promisify } from './utils';

const readFileAsync = promisify(readFile);
const resolveSourceMapAsync = promisify(resolveSourceMap);

export default function sourceMapsPlugin({ include, exclude } = {}) {
  const filter = createFilter(include, exclude);

  return {
    async load(id) {
      if (!filter(id)) {
        return null;
      }

      let code;
      try {
        code = await readFileAsync(id, 'utf8');
      } catch (err) {
        // Failed, let Rollup deal with it
        return null;
      }

      let sourceMap;
      try {
        sourceMap = await resolveSourceMapAsync(code, id, readFile);
      } catch (err) {
        console.error(`rollup-plugin-sourcemaps: Failed resolving source map from ${id}: ${err}`);
        return code;
      }

      // No source map detected, return code
      if (sourceMap === null) {
        return code;
      }

      const { map } = sourceMap;

      return { code, map };
    },
  };
}
