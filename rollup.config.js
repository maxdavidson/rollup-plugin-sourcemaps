/* eslint-disable import/no-extraneous-dependencies */
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  sourceMap: true,
  plugins: [
    babel(),
  ],
  external: [
    'fs',
    'rollup-pluginutils',
    'source-map-resolve',
  ],
  targets: [
    { dest: 'dist/rollup-plugin-sourcemaps.js', format: 'cjs' },
    { dest: 'dist/rollup-plugin-sourcemaps.es.js', format: 'es' },
  ],
};
