/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-non-null-assertion */
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { rollup } from 'rollup';
import { describe, it, test, expect } from '@jest/globals';

import sourcemaps, { SourcemapsPluginOptions } from '..';

const inputPath = path.join(__dirname, '../index.ts');
const inputText = fs.readFileSync(inputPath, 'utf8');

const outputPath = path.format({
  dir: path.dirname(inputPath),
  name: path.basename(inputPath, path.extname(inputPath)),
  ext: '.js',
});

const sourceMapPath = path.format({
  dir: path.dirname(inputPath),
  name: path.basename(inputPath, path.extname(inputPath)),
  ext: '.js.map',
});

async function rollupBundle({
  outputText,
  sourceMapText,
  pluginOptions,
}: ts.TranspileOutput & {
  pluginOptions?: SourcemapsPluginOptions;
}) {
  function load(path: string) {
    switch (path.toLowerCase()) {
      case inputPath.toLowerCase():
        return inputText;
      case outputPath.toLowerCase():
        return outputText;
      case sourceMapPath.toLowerCase():
        return sourceMapText!;
      default:
        throw new Error(`Unexpected path: ${path}`);
    }
  }

  const { generate } = await rollup({
    input: outputPath,
    external: () => true,
    plugins: [
      { name: 'skip-checks', resolveId: path => path },
      sourcemaps({
        async readFile(path: string) {
          return load(path);
        },
        ...pluginOptions,
      }),
      { name: 'fake-fs', load },
    ],
  });

  const { output } = await generate({
    format: 'esm',
    sourcemap: true,
    sourcemapPathTransform(relativePath) {
      return path.resolve(__dirname, '..', '..', relativePath);
    },
  });

  return output[0];
}

it('ignores files with no source maps', async () => {
  const { outputText, sourceMapText } = ts.transpileModule(inputText, {
    fileName: inputPath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2017,
      sourceMap: false,
      inlineSourceMap: false,
    },
  });

  expect(sourceMapText).toBeUndefined();

  const { map } = await rollupBundle({ outputText, sourceMapText });

  expect(map).toBeDefined();
  expect(map?.sources.map(path.normalize)).toStrictEqual([outputPath]);
  expect(map?.sourcesContent).toStrictEqual([outputText]);
});

describe('detects files with source maps', () => {
  test.each`
    sourceMap | inlineSourceMap | inlineSources
    ${true}   | ${false}        | ${false}
    ${false}  | ${true}         | ${false}
    ${true}   | ${false}        | ${true}
    ${false}  | ${true}         | ${true}
  `(
    'sourceMap: $sourceMap, inlineSourceMap: $inlineSourceMap, inlineSources: $inlineSources',
    async ({
      sourceMap,
      inlineSourceMap,
      inlineSources,
    }: {
      sourceMap: boolean;
      inlineSourceMap: boolean;
      inlineSources: boolean;
    }) => {
      const { outputText, sourceMapText } = ts.transpileModule(inputText, {
        fileName: inputPath,
        compilerOptions: {
          target: ts.ScriptTarget.ES2017,
          sourceMap,
          inlineSourceMap,
          inlineSources,
        },
      });

      if (sourceMap) {
        expect(sourceMapText).toBeDefined();
      } else {
        expect(sourceMapText).toBeUndefined();
      }

      const { map } = await rollupBundle({ outputText, sourceMapText });

      expect(map).toBeDefined();
      expect(map?.sources.map(path.normalize)).toStrictEqual([inputPath]);
      expect(map?.sourcesContent).toStrictEqual([inputText]);
    },
  );
});

describe('ignores filtered files', () => {
  test('included', async () => {
    const { outputText, sourceMapText } = ts.transpileModule(inputText, {
      fileName: inputPath,
      compilerOptions: {
        target: ts.ScriptTarget.ES2017,
        sourceMap: true,
      },
    });

    expect(sourceMapText).toBeDefined();

    const { map } = await rollupBundle({
      outputText,
      sourceMapText,
      pluginOptions: {
        include: ['dummy-file'],
      },
    });

    expect(map).toBeDefined();
    expect(map?.sources.map(path.normalize)).toStrictEqual([outputPath]);
    expect(map?.sourcesContent).toStrictEqual([outputText]);
  });

  test('excluded', async () => {
    const { outputText, sourceMapText } = ts.transpileModule(inputText, {
      fileName: inputPath,
      compilerOptions: {
        target: ts.ScriptTarget.ES2017,
        sourceMap: true,
      },
    });

    expect(sourceMapText).toBeDefined();

    const { map } = await rollupBundle({
      outputText,
      sourceMapText,
      pluginOptions: {
        exclude: [path.relative(process.cwd(), outputPath).split(path.sep).join(path.posix.sep)],
      },
    });

    expect(map).toBeDefined();
    expect(map?.sources.map(path.normalize)).toStrictEqual([outputPath]);
    expect(map?.sourcesContent).toStrictEqual([outputText]);
  });
});

it('delegates failing file reads to the next plugin', async () => {
  const { outputText, sourceMapText } = ts.transpileModule(inputText, {
    fileName: inputPath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2017,
      sourceMap: true,
    },
  });

  expect(sourceMapText).toBeDefined();

  const { map } = await rollupBundle({
    outputText,
    sourceMapText,
    pluginOptions: {
      async readFile() {
        throw new Error('Failed!');
      },
    },
  });

  expect(map).toBeDefined();
  expect(map?.sources.map(path.normalize)).toStrictEqual([outputPath]);
  expect(map?.sourcesContent).toStrictEqual([outputText]);
});

it('handles failing source maps reads', async () => {
  const { outputText, sourceMapText } = ts.transpileModule(inputText, {
    fileName: inputPath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2017,
      sourceMap: true,
    },
  });

  expect(sourceMapText).toBeDefined();

  const { map } = await rollupBundle({
    outputText,
    sourceMapText,
    pluginOptions: {
      async readFile(path: string) {
        switch (path.toLowerCase()) {
          case inputPath.toLowerCase():
            return inputText;
          case outputPath.toLowerCase():
            return outputText;
          default:
            throw new Error(`Unexpected path: ${path}`);
        }
      },
    },
  });

  expect(map).toBeDefined();
  expect(map?.sources.map(path.normalize)).toStrictEqual([outputPath]);
  expect(map?.sourcesContent).toStrictEqual([outputText]);
});
