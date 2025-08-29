// @ts-check
/**
 * @param {import("./../index.js").Package} pkg
 * @param {{ fileName?: string, exclude?: string[] }} [options]
 */
import { defineTSConfig } from "pkg-types";

/**
 * @param {Parameters<typeof import("./../index.js").getTSConfigReferences>[0]} pkg
 * @param {Parameters<typeof import("./../index.js").getTSConfigReferences>[1]} [options]
 */

export function getTSConfigReferences(pkg, options) {
  const deps = {
    ...pkg.manifest.dependencies,
    ...pkg.manifest.devDependencies,
    ...pkg.manifest.peerDependencies,
  };
  const fileName = options?.fileName ?? "tsconfig.build.json";
  return Object.entries(deps)
    .filter(([name, ver]) => ver === "workspace:*")
    .filter(([name]) => !options?.exclude || !options.exclude.includes(name))
    .map(([name]) => ({
      path: `../${name.split("/").pop()}/${fileName}`,
    }));
}

/**
 * @param {import("./../index.js").Package[]} packages
 * @param {{ fileName?: string, exclude?: string[] }} [options]
 */
export function getRootTSConfigReferences(packages, options) {
  const fileName = options?.fileName ?? "tsconfig.build.json";
  return packages
    .filter((pkg) => !pkg.isRoot && pkg.isTypeScript)
    .filter(
      (pkg) =>
        !options?.exclude || !options.exclude.includes(pkg.manifest.name ?? ""),
    )
    .map((pkg) => ({ path: `${pkg.dir}/${fileName}` }));
}

/**
 * @param {Parameters<typeof import("./../index.js").createTSConfigFiles>[0]} options
 */

export function createTSConfigFiles(options) {
  const { pkg, packages } = options;
  const presets = ["base", "build", "publish", "solid", "vite"];
  const extendsValue = (
    Array.isArray(options.extends)
      ? options.extends.filter((name) => typeof name === "string")
      : Object.entries(options.extends || {})
          .filter(([, enabled]) => enabled)
          .map(([name]) => name)
  ).map((name) =>
    presets.includes(name) ? `@dreamkit/tsconfig/${name}.json` : name,
  );
  /** @type {Record<string, any>} */
  const files = {};
  if (pkg.isRoot) {
    files["tsconfig.build.json"] = defineTSConfig({
      include: [],
      references: getRootTSConfigReferences(packages),
      ...options.base,
    });
  } else if (pkg.isTypeScript) {
    files["tsconfig.json"] = defineTSConfig({
      extends: ["@dreamkit/tsconfig", "./tsconfig.build.json"],
      ...options.base,
    });
    files["tsconfig.build.json"] = defineTSConfig({
      references: getTSConfigReferences(pkg, {
        exclude: ["@dreamkit/tsconfig"],
      }),
      extends: ["@dreamkit/tsconfig/build.json", ...extendsValue],
      ...options.build,
    });
  }
  return files;
}
