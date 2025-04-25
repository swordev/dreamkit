// @ts-check
import { compareObjects } from "./../utils/object.js";
import { readFile, writeFile } from "fs/promises";

/**
 *
 * @param {string} source
 * @param {import("prettier").Options & {cwd?: string }|undefined} options
 * @returns
 */

export async function formatWithConfig(source, options) {
  const cwd = options?.cwd ?? process.cwd();
  const prettier = await import("prettier");
  const config = await prettier.resolveConfig(cwd, {
    useCache: true,
  });
  return prettier.format(source, {
    ...config,
    ...options,
  });
}

/**
 * @param {string} path
 * @returns {Promise<any>}
 */
export async function readJSONFile(path) {
  const pkgBuffer = await readFile(path);
  return JSON.parse(pkgBuffer.toString());
}

/**
 * @param {string} path
 * @returns {Promise<string|undefined>}
 */
export async function tryReadFile(path) {
  try {
    return (await readFile(path)).toString();
  } catch (_) {
    return;
  }
}

/**
 * @param {string} path
 * @returns {Promise<any>}
 */
export async function tryReadJSONFile(path) {
  try {
    return await readJSONFile(path);
  } catch (_) {
    return;
  }
}

/**
 * @param {string} path
 * @param {any} data
 * @param {string} filePath
 * @returns {Promise<void>}
 */
export async function writeJSONFile(path, data, filePath = "tsconfig.json") {
  const current = (await tryReadJSONFile(path)) || {};
  const equals = compareObjects(current, data);
  if (!equals)
    await writeFile(
      path,
      await formatWithConfig(JSON.stringify(data), {
        filepath: filePath,
      }),
    );
}
