/* eslint-disable no-console */
import { createFilter } from 'rollup-pluginutils';
import { resolve, dirname } from 'path';
import { readFile } from 'fs';
import { promisify } from './utils';

const readFileAsync = promisify(readFile);

// Borrowed from https://github.com/webpack/source-map-loader
const baseRegex = '\\s*[@#]\\s*sourceMappingURL\\s*=\\s*([^\\s]*)';
const regex1 = new RegExp(`/\\*${baseRegex}\\s*\\*/`); // Matches /* ... */ comments
const regex2 = new RegExp(`//${baseRegex}($|\n|\r\n?)`); // Matches // .... comments
const regexDataUrl = /data:[^;\n]+;base64,(.*)/; // Matches DataUrls

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

      const match = regex1.exec(code) || regex2.exec(code);

      if (match === null) {
        // No source map, return code
        return code;
      }

      const [sourceMapComment, sourceMapURL] = match;
      const dataUrlMatch = regexDataUrl.exec(sourceMapURL);

      // Remove the source map comment, and make sure we don't return an empty string
      code = code.replace(sourceMapComment, '') || '\n';

      let rawMap;
      if (dataUrlMatch) {
        rawMap = new Buffer(dataUrlMatch[1], 'base64').toString();
      } else {
        const sourceMapPath = resolve(dirname(id), sourceMapURL);
        try {
          rawMap = await readFileAsync(sourceMapPath, 'utf8');
        } catch (err) {
          console.error(`rollup-plugin-sourcemaps: Could not open source map: ${err}`);
          return code;
        }
      }

      let map;
      try {
        map = JSON.parse(rawMap);
      } catch (err) {
        console.error(`rollup-plugin-sourcemaps: Failed parsing raw source map from ${id}: ${err}`);
        return code;
      }

      return { code, map };
    },
  };
}
