/* eslint-disable import/prefer-default-export */
export function promisify(nodeFn) {
  return (...args) => new Promise((resolve, reject) => {
    nodeFn(...args, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}
