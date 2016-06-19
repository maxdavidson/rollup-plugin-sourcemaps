import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  sourceMap: true,
  plugins: [
    babel({
      runtimeHelpers: true,
    }),
  ],
  external: [
    'fs',
    'rollup-pluginutils',
    'source-map-resolve',
    'babel-runtime/regenerator',
    'babel-runtime/core-js/promise',
    'babel-runtime/helpers/asyncToGenerator',
  ],
  targets: [
    { dest: 'dist/rollup-plugin-sourcemaps.js', format: 'cjs' },
    { dest: 'dist/rollup-plugin-sourcemaps.esm.js', format: 'es6' },
  ],
};
