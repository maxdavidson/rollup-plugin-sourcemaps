# rollup-plugin-include-sourcemaps

[Rollup](https://rollupjs.org) plugin for loading files with existing source maps.
Inspired by [webpack/source-map-loader](https://github.com/webpack/source-map-loader).

If you use [rollup-plugin-babel](https://github.com/rollup/rollup-plugin-babel),
you might be able to use the [`inputSourceMap`](https://babeljs.io/docs/en/options#inputsourcemap) option instead of this plugin.

## Why?

- You transpile your files with source maps before bundling with rollup
- You consume external modules with bundled source maps

## Usage

```javascript
import sourcemaps from 'rollup-plugin-include-sourcemaps';

export default {
  input: 'src/index.js',
  plugins: [sourcemaps()],
  output: {
    sourcemap: true,
    file: 'dist/my-awesome-package.js',
  },
};
```
