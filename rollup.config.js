/* eslint-disable import/no-extraneous-dependencies */
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  external: ['fs', 'rollup-pluginutils', 'source-map-resolve'],
  plugins: [babel()],
  output: [
    {
      file: 'dist/rollup-plugin-sourcemaps.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/rollup-plugin-sourcemaps.es.js',
      format: 'es',
      sourcemap: true,
    },
  ],
};
