import { createFilter } from 'rollup-pluginutils';
import { resolve as resolveSourceMap } from 'source-map-resolve';
import * as fs from 'fs';

export default function sourcemaps({ include, exclude, readFile = fs.readFile } = {}) {
  const filter = createFilter(include, exclude);

  return {
    name: 'sourcemaps',

    load(id) {
      if (!filter(id)) {
        return null;
      }

      return new Promise(resolve => {
        readFile(id, 'utf8', (err, code) => {
          if (err) {
            // Failed reading file, let the next plugin deal with it
            resolve(null);
          } else {
            resolveSourceMap(code, id, readFile, (err, sourceMap) => {
              if (err || sourceMap === null) {
                // Either something went wrong, or there was no source map
                resolve(code);
              } else {
                const { map, sourcesContent } = sourceMap;
                map.sourcesContent = sourcesContent;
                resolve({ code, map });
              }
            });
          }
        });
      });
    },
  };
}
