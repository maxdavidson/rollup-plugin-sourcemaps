import fs from 'fs';
import path from 'path';
import { callbackify } from 'util';
import ts from 'typescript';
import { rollup } from 'rollup';

import sourcemaps from '..';

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
}: {
  outputText: string;
  sourceMapText?: string;
}) {
  const bundle = await rollup({
    input: outputPath,
    external: () => true,
    plugins: [
      { name: 'skip-checks', resolveId: path => path },
      sourcemaps({
        readFile: callbackify(async (path: string) => {
          switch (path) {
            case inputPath:
              return inputText;
            case outputPath:
              return outputText;
            case sourceMapPath:
              return sourceMapText!;
            default:
              throw new Error(`Unexpected path: ${path}`);
          }
        }),
      }),
    ],
  });

  const { output } = await bundle.generate({
    format: 'esm',
    sourcemap: true,
    sourcemapPathTransform(relativePath) {
      return path.resolve(__dirname, '..', '..', relativePath);
    },
  });

  return output[0];
}

test('ignores files with no source maps', async () => {
  const { outputText, sourceMapText } = ts.transpileModule(inputText, {
    fileName: inputPath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2017,
    },
  });

  expect(sourceMapText).toBeUndefined();

  const { map } = await rollupBundle({
    outputText,
    sourceMapText,
  });

  expect(map).toBeDefined();

  expect(map!.sources).toBeDefined();
  expect(map!.sources).toStrictEqual([outputPath]);

  expect(map!.sourcesContent).toBeDefined();
  expect(map!.sourcesContent).toStrictEqual([outputText]);
});

test.each`
  sourceMap | inlineSourceMap | inlineSources
  ${true}   | ${false}        | ${false}
  ${false}  | ${true}         | ${false}
  ${true}   | ${false}        | ${true}
  ${false}  | ${true}         | ${true}
`(
  'sourceMap: $sourceMap, inlineSourceMap: $inlineSourceMap, inlineSources: $inlineSources',
  async ({ sourceMap, inlineSourceMap, inlineSources }) => {
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

    const { map } = await rollupBundle({
      outputText,
      sourceMapText,
    });

    expect(map).toBeDefined();

    expect(map!.sources).toBeDefined();
    expect(map!.sources).toStrictEqual([inputPath]);

    expect(map!.sourcesContent).toBeDefined();
    expect(map!.sourcesContent).toStrictEqual([inputText]);
  },
);
