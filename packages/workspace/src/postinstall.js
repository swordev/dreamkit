// @ts-check
import { readJSONFile, writeJSONFile } from "./utils/fs.js";
import { getTSConfigReferences } from "./utils/tsconfig.js";
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
    const manifest = await readJSONFile(manifestPath);
    packages.push({
      dir,
      manifestPath,
      manifest,
      folder,
    });
  }
  return [
    {
      dir: ".",
      folder: ".",
      manifest: await readJSONFile("./package.json"),
      manifestPath: "./package.json",
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
  const rootTsconfig = await readJSONFile("tsconfig.build.json");
  const rootReferences = [];

  const workspacePath = join(process.cwd(), "workspace.mjs");
  /** @type {import("./index.js").WorkspaceHandler|undefined} */
  let workspace;
  if (existsSync(workspacePath))
    workspace = (await import(`file://${workspacePath}`)).default;

  for (const pkg of packages) {
    if (filter && !filter.includes(pkg.folder)) continue;

    const config = pkg.manifest["x-dreamkit"] || {};

    console.info(`- ${pkg.folder}`);

    if (config.profile === "lib") {
      const tsconfigTpl = {
        root: {
          path: `${pkg.dir}/tsconfig.json`,
          data: {
            compilerOptions: { noEmit: true, rootDir: "." },
            extends: "./tsconfig.build.json",
            include: ["src", "test"],
          },
        },
        build: {
          path: `${pkg.dir}/tsconfig.build.json`,
          data: {
            extends: "@dreamkit/tsconfig/lib.json",
            references: getTSConfigReferences(pkg.manifest),
          },
        },
      };

      rootReferences.push({ path: tsconfigTpl.build.path });
      await writeJSONFile(tsconfigTpl.root.path, tsconfigTpl.root.data);
      await writeJSONFile(tsconfigTpl.build.path, tsconfigTpl.build.data);
    }

    if (workspace) {
      const result =
        (await workspace(pkg.manifest, { ...pkg, packages })) || {};
      for (const file in result.files || {}) {
        const filePath = join(pkg.dir, file);
        const fileContents = result.files?.[file];
        if (typeof fileContents === "object" && !!fileContents) {
          await writeJSONFile(filePath, fileContents);
        } else if (typeof fileContents === "string") {
          await writeFile(filePath, fileContents);
        }
      }
    }
  }

  rootTsconfig.references = rootReferences;
  await writeJSONFile("tsconfig.build.json", rootTsconfig);
}
