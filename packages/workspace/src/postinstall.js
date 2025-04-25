// @ts-check
import {
  readJSONFile,
  tryReadFile,
  tryReadJSONFile,
  writeJSONFile,
} from "./utils/fs.js";
import { existsSync } from "fs";
import { readdir, writeFile } from "fs/promises";
import { join } from "path";

/** @return {Promise<import("./index.js").Package[]>} */
async function findPackages() {
  const packagesDir = "./packages";
  const pkgFolders = await readdir(packagesDir);
  /** @type {import("./index.js").Package[]} */
  const packages = [];
  for (const folder of pkgFolders) {
    const dir = `${packagesDir}/${folder}`;
    const manifestPath = `${dir}/package.json`;
    const srcPath = `${dir}/src`;
    const manifest = await readJSONFile(manifestPath);
    const files = [
      ...(await readdir(dir)),
      ...(existsSync(srcPath) ? await readdir(srcPath) : []),
    ];
    packages.push({
      dir,
      name: manifest.name,
      manifestPath,
      manifest,
      folder,
      isRoot: false,
      isTypeScript: files.some(
        (file) =>
          (file.endsWith(".ts") || file.endsWith(".tsx")) &&
          !file.endsWith(".d.ts"),
      ),
    });
  }
  const manifest = await readJSONFile("./package.json");
  return [
    {
      dir: ".",
      folder: ".",
      name: manifest.name,
      manifest: manifest,
      manifestPath: "./package.json",
      isRoot: true,
      isTypeScript: true,
    },
    ...packages,
  ];
}

/**
 * @param {string} inputFilter
 */
export async function postinstall(inputFilter) {
  const filter = inputFilter
    ? inputFilter.split(",").map((v) => v.trim())
    : undefined;

  const packages = await findPackages();

  const workspacePath = join(process.cwd(), "workspace.mjs");
  /** @type {import("./index.js").WorkspaceHandler|undefined} */
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
