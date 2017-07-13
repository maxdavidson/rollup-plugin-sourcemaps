import test from 'ava';
import * as path from 'path';
import { rollup } from 'rollup';
import sourcemaps from '../';

test('meta', async (t) => {
  const entry = path.join(__dirname, '../dist/rollup-plugin-sourcemaps.es.js');

  const bundle = await rollup({
    entry,
    plugins: [
      sourcemaps(),
    ],
  });

  const result = await bundle.generate({
    format: 'es',
    sourceMap: true,
  });

  t.not(result.map, undefined);
  t.not(result.map.sources, undefined);

  const expectedPath = path.resolve(__dirname, '../src/index.js');
  const sourceMapPaths = result.map.sources.map(source => path.resolve(entry, source));

  t.not(sourceMapPaths.indexOf(expectedPath), -1);
});
