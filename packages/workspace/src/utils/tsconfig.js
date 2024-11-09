/**
 * @param {import("pkg-types").PackageJson} pkg
 */

export function getTSConfigReferences(pkg) {
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };

  return Object.entries(deps)
    .filter(
      ([name, ver]) => ver === "workspace:*" && name !== "@dreamkit/tsconfig",
    )
    .map(([name]) => ({
      path: `../${name.split("/").pop()}/tsconfig.build.json`,
    }));
}
