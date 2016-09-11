/* eslint-disable no-console, no-shadow */
import { createFilter } from 'rollup-pluginutils';
import * as smr from 'source-map-resolve';
import * as fs from 'fs';

export default function sourcemaps({ include, exclude } = {}) {
  const filter = createFilter(include, exclude);

  return {
    name: 'sourcemaps',

    load(id) {
      if (!filter(id)) {
        return null;
      }

      return new Promise(resolve => {
        fs.readFile(id, 'utf8', (err, code) => {
          if (err) {
            resolve(null);
            return;
          }

          smr.resolve(code, id, fs.readFile, (err, sourceMap) => {
            if (err || sourceMap === null) {
              resolve(code);
              return;
            }

            const { map, sourcesContent } = sourceMap;
            map.sourcesContent = sourcesContent;

            resolve({ code, map });
          });
        });
      });
    },
  };
}
