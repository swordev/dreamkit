// @ts-check
/**
 * @param {import("./../index.js").Package} pkg
 * @param {{ fileName?: string, exclude?: string[] }} [options]
 */
import { join, relative } from "path";
import { defineTSConfig } from "pkg-types";

/**
 * @param {Parameters<typeof import("./../index.js").getTSConfigReferences>[0]} pkg
 * @param {Parameters<typeof import("./../index.js").getTSConfigReferences>[1]} packages
 * @param {Parameters<typeof import("./../index.js").getTSConfigReferences>[2]} [options]
 */

export function getTSConfigReferences(pkg, packages, options) {
  const deps = {
    ...pkg.manifest.dependencies,
    ...pkg.manifest.devDependencies,
    ...pkg.manifest.peerDependencies,
  };
  const fileName = options?.fileName ?? "tsconfig.build.json";
  return Object.entries(deps)
    .filter(([name, ver]) => ver === "workspace:*")
    .filter(([name]) => !options?.exclude || !options.exclude.includes(name))
    .map(([name]) => {
      const depPkg = packages.find((pkg) => pkg.name === name);

      if (!depPkg)
        throw new Error(`Workspace package (${name}) not found in ${pkg.name}`);

      if (!depPkg.isTypeScript) return;

      const absPath = join(depPkg.dir, fileName);
      const path = relative(pkg.dir, absPath).replaceAll("\\", "/");

      return { path };
    })
    .filter((v) => !!v);
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
  const cjs = packages.some((pkg) => pkg.isTypeScript && pkg.manifest.main);
  /** @type {Record<string, any>} */
  const files = {};
  if (pkg.isRoot) {
    if (cjs)
      files["tsconfig.build-cjs.json"] = defineTSConfig({
        include: [],
        references: getRootTSConfigReferences(
          packages.filter((pkg) => pkg.isTypeScript && pkg.manifest.main),
          {
            fileName: "tsconfig.build-cjs.json",
          },
        ),
        ...options.base,
      });
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
      references: getTSConfigReferences(pkg, packages, {
        exclude: ["@dreamkit/tsconfig"],
      }),
      extends: ["@dreamkit/tsconfig/build.json", ...extendsValue],
      ...options.build,
    });
    if (pkg.isTypeScript && pkg.manifest.main)
      files["tsconfig.build-cjs.json"] = defineTSConfig({
        compilerOptions: {
          outDir: "lib-cjs",
          module: "commonjs",
          moduleResolution: "Node",
        },
        extends: ["./tsconfig.build.json"],
        references: getTSConfigReferences(pkg, packages, {
          exclude: ["@dreamkit/tsconfig"],
          fileName: "tsconfig.build-cjs.json",
        }),
      });
  }
  return files;
}
