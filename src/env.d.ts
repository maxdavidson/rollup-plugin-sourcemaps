declare module 'source-map-resolve' {
  import fs from 'fs';
  import { ExistingRawSourceMap } from 'rollup';

  export interface ResolvedSourceMap {
    /** The source map for code, as an object */
    map: ExistingRawSourceMap;
    /** The url to the source map. If the source map came from a data uri, this property is null, since then there is no url to it. */
    url: string | null;
    /**
     * The url that the sources of the source map are relative to.
     * Since the sources are relative to the source map, and the url to the source map is provided as the url property, this property might seem superfluos.
     * However, remember that the url property can be null if the source map came from a data uri.
     * If so, the sources are relative to the file containing the data uri—codeUrl.
     * This property will be identical to the url property or codeUrl, whichever is appropriate.
     * This way you can conveniently resolve the sources without having to think about where the source map came from.
     */
    sourcesRelativeTo: string;
    /** The url of the sourceMappingURL comment in code */
    sourceMappingURL: string;
  }

  /**
   *
   * @param code A string of code that may or may not contain a sourceMappingURL comment. Such a comment is used to resolve the source map.
   * @param codeUrl The url to the file containing code. If the sourceMappingURL is relative, it is resolved against codeUrl.
   * @param read A function that reads url and responds using callback(error, content).
   * @param callback A function that is invoked with either an error or null and the result.
   */
  export function resolveSourceMap(
    code: string,
    codeUrl: string,
    read: (
      path: string,
      callback: (error: Error | null, data: Buffer | string) => void,
    ) => void,
    callback: (
      error: Error | null,
      /** If code contains no sourceMappingURL, the result is null. */
      result: ResolvedSourceMap | null
    ) => void
  ): void;


  export interface ResolvedSources {
    /** The same as map.sources, except all the sources are fully resolved. */
    sourcesResolved: string[];
    /** 
     * An array with the contents of all sources in map.sources, in the same order as map.sources. 
     * If getting the contents of a source fails, an error object is put into the array instead. 
     * */
    sourcesContent: (string | Error)[];
  }

  /**
   *
   * @param code A string of code that may or may not contain a sourceMappingURL comment. Such a comment is used to resolve the source map.
   * @param codeUrl The url to the file containing code. If the sourceMappingURL is relative, it is resolved against codeUrl.
   * @param read A function that reads url and responds using callback(error, content).
   * @param callback A function that is invoked with either an error or null and the result.
   */
  export function resolveSources(
    map: ExistingRawSourceMap,
    mapUrl: string,
    read: (
      path: string,
      callback: (error: Error | null, data: Buffer | string) => void,
    ) => void,
    callback: (
      error: Error | null,
      result: ResolvedSources
    ) => void
  ): void;

}
