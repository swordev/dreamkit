// @ts-check
import { findPackageDirs } from "./utils/pkg.js";
import { readdir, rm, rmdir } from "fs/promises";
import { basename, join } from "path";

/**
 * @param {string} inputFilter
 */
export async function clean(inputFilter) {
  const filter = inputFilter
    ? inputFilter.split(",").map((v) => v.trim())
    : undefined;

  const pkgDirs = await findPackageDirs(process.cwd());

  try {
    await rm("node_modules", { recursive: true });
  } catch (error) {}

  for (const pkgDir of pkgDirs) {
    const pkgFolder = basename(pkgDir);
    if (filter && !filter.includes(pkgFolder)) continue;
    console.info(`- ${pkgFolder}`);

    for (const name of await readdir(pkgDir)) {
      if (
        ["node_modules", "lib", "dist"].includes(name) ||
        name.endsWith(".tsbuildinfo")
      ) {
        try {
          await rm(join(pkgDir, name), { recursive: true });
        } catch (error) {}
      }
    }

    try {
      await rmdir(pkgDir);
    } catch (error) {}
  }
}
