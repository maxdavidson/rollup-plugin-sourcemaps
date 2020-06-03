// @ts-check
import typescript from '@rollup/plugin-typescript';

import packageJson from './package.json';

export default /** @type {import('rollup').RollupOptions} */ ({
  input: 'src/index.ts',
  external: Object.values(packageJson.dependencies),
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
    },
  ],
});
