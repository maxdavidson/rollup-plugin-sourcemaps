import { createFilter } from 'rollup-pluginutils';
import { resolve as resolveSourceMap } from 'source-map-resolve';
import { readFile } from 'fs';

// resolveSourceMap will url-escape paths containing spaces, which will make
// readFile fail to locate files. So we need to unescape paths before passing
// them to readFile.
function readFileProxy(...args) {
  if (args.length) {
    // eslint-disable-next-line no-param-reassign
    args[0] = unescape(args[0]);
  }
  return readFile(...args);
}

export default function sourcemaps({ include, exclude } = {}) {
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
            resolveSourceMap(code, id, readFileProxy, (err, sourceMap) => {
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
