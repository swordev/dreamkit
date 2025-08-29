import { listPNPMPackagePaths } from "./pnpm.js";
import { existsSync } from "fs";
import { relative } from "path";

/**
 * @param {string} root
 * @returns {Promise<string[]>}
 */
export async function findPackageDirs(root) {
  let paths = [];
  if (existsSync(`${root}/pnpm-workspace.yaml`)) {
    paths = listPNPMPackagePaths().slice(1);
  } else {
    const packagesDir = join(root, "packages");
    const pkgFolders = await readdir(packagesDir);
    for (const folder of pkgFolders) {
      paths.push(`${packagesDir}/${folder}`);
    }
  }
  return paths.map((path) => "./" + relative(root, path).replaceAll("\\", "/"));
}
