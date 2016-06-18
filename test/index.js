/* eslint-disable import/no-unresolved */
import test from 'ava';
import { resolve } from 'path';
import { rollup } from 'rollup';
import sourcemaps from '../';

test('meta', async (t) => {
  const entry = '../dist/rollup-plugin-sourcemaps.esm.js';

  const bundle = await rollup({
    entry,
    plugins: [
      sourcemaps(),
    ],
  });

  const result = bundle.generate({
    format: 'es6',
    sourceMap: true,
  });

  t.not(result.map, undefined);
  t.not(result.map.sources, undefined);

  const expectedPath = resolve(process.cwd(), '../src/index.js');
  const sourceMapPaths = result.map.sources.map(source => resolve(entry, source));

  t.not(sourceMapPaths.indexOf(expectedPath), -1);
});
