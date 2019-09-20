import sourcemaps from 'rollup-plugin-sourcemaps';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: '.code/index.js',
    external: ['fs', 'util', 'rollup-pluginutils', 'source-map-resolve'],
    plugins: [sourcemaps()],
    output: [
      {
        file: 'dist/rollup-plugin-sourcemaps.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/rollup-plugin-sourcemaps.es.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
  },
  {
    input: '.code/index.d.ts',
    external: ['fs'],
    plugins: [dts()],
    output: {
      file: 'dist/rollup-plugin-sourcemaps.d.ts',
    },
  },
];
