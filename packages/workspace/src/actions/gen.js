// @ts-check
import {
  readJSONFile,
  tryReadFile,
  tryReadJSONFile,
  writeJSONFile,
} from "../utils/fs.js";
import { findPackageDirs } from "../utils/pkg.js";
import { existsSync } from "fs";
import { readdir, writeFile } from "fs/promises";
import { basename, join } from "path";

/** @return {Promise<import("../index.js").Package[]>} */
export async function findPackages() {
  const pkgDirs = await findPackageDirs(process.cwd());
  /** @type {import("../index.js").Package[]} */
  const packages = [];
  for (const dir of pkgDirs) {
    const folder = basename(dir);
    const manifestPath = `${dir}/package.json`;
    const srcPath = `${dir}/src`;
    /** @type {import("pkg-types").PackageJson} */
    const manifest = await readJSONFile(manifestPath);
    const files = [
      ...(await readdir(dir)),
      ...(existsSync(srcPath) ? await readdir(srcPath) : []),
    ];
    const deps = Object.keys({
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies,
      ...manifest.optionalDependencies,
    });
    packages.push({
      dir,
      name: manifest.name ?? "",
      manifestPath,
      manifest,
      folder,
      isRoot: false,
      deps,
      isTypeScript: files.some(
        (file) =>
          (file.endsWith(".ts") || file.endsWith(".tsx")) &&
          !file.endsWith(".d.ts"),
      ),
    });
  }
  const manifest = await readJSONFile("./package.json");
  const deps = Object.keys({
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
    ...manifest.optionalDependencies,
  });
  return [
    {
      dir: ".",
      folder: ".",
      name: manifest.name,
      manifest: manifest,
      manifestPath: "./package.json",
      isRoot: true,
      deps,
      isTypeScript: true,
    },
    ...packages,
  ];
}

/**
 * @param {string} inputFilter
 */
export async function gen(inputFilter) {
  const filter = inputFilter
    ? inputFilter.split(",").map((v) => v.trim())
    : undefined;

  const packages = await findPackages();

  const workspacePath = join(process.cwd(), "workspace.mjs");
  /** @type {import("../index.js").WorkspaceHandler|undefined} */
  let workspace;
  if (existsSync(workspacePath))
    workspace = (await import(`file://${workspacePath}`)).default;

  for (const pkg of packages) {
    if (filter && !filter.includes(pkg.folder)) continue;

    console.info(`- ${pkg.folder}`);

    const result =
      (await workspace?.({ pkg: pkg, packages, isRoot: pkg.isRoot })) || {};
    const files = { ...result.files };

    for (const file in files) {
      const filePath = join(pkg.dir, file);
      const value = files[file];
      const isJSON = filePath.endsWith(".json") || filePath.endsWith(".jsonc");
      const prev =
        typeof value === "function" && value.length
          ? isJSON
            ? tryReadJSONFile(filePath)
            : tryReadFile(filePath)
          : undefined;

      const next = typeof value === "function" ? value(prev) : value;

      if (next !== undefined && next !== false) {
        if (isJSON) {
          await writeJSONFile(filePath, next);
        } else {
          await writeFile(filePath, next);
        }
      }
    }
  }
}
