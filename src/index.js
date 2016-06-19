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
const regexDataUrl = /data:(.*?)(?:;charset=(.*?))?(?:;(base64))?,(.+)/i; // Matches data urls

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

      // Check for source map comments
      const match = regex1.exec(code) || regex2.exec(code);

      // No source map detected, return code
      if (match === null) {
        return code;
      }

      const [sourceMapComment, sourceMapURL] = match;

      // Remove the source map comment, and make sure we don't return an empty string
      code = code.replace(sourceMapComment, '') || '\n';

      // Check if the source map is inlined, i.e. it uses a data url
      const dataUrlMatch = regexDataUrl.exec(sourceMapURL);

      let rawMap;
      if (dataUrlMatch !== null) {
        /* eslint-disable no-unused-vars */
        const [dataUrl, mimeType, charset = 'utf8', encoding = 'base64', data] = dataUrlMatch;
        /* eslint-enable */
        try {
          rawMap = new Buffer(data, encoding).toString(charset);
        } catch (err) {
          console.error(`rollup-plugin-sourcemaps: Failed parsing data url: ${err}`);
          return code;
        }
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
