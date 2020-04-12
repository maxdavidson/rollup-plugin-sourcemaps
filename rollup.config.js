// @ts-check
import typescript from '@rollup/plugin-typescript';

/** @type {import('rollup').RollupOptions} */
const config = {
  input: 'src/index.ts',
  external: () => true,
  plugins: [typescript()],
  output: [
    {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true,
    },
    {
      dir: 'dist',
      format: 'es',
      sourcemap: true,
      entryFileNames: '[name].es.js',
    },
  ],
};

export default config;
