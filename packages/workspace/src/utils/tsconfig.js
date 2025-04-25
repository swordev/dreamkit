/**
 * @param {import("./../index.js").Package} pkg
 * @param {{ fileName?: string, exclude?: string[] }} [options]
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
        !options?.exclude || !options.exclude.includes(pkg.manifest.name),
    )
    .map((pkg) => ({ path: `${pkg.dir}/${fileName}` }));
}
