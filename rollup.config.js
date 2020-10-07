// @ts-check
import typescript from '@rollup/plugin-typescript';

export default /** @type {import('rollup').RollupOptions} */ ({
  input: 'src/index.ts',
  external: () => true,
  plugins: [typescript()],
  output: [
    {
      dir: 'dist',
      format: 'es',
      sourcemap: true,
      entryFileNames: '[name].js',
    },
    {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true,
      entryFileNames: '[name].cjs',
      exports: 'default',
    },
  ],
});
