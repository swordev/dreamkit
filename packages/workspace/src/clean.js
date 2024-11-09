// @ts-check
import { readdir, rm, rmdir } from "fs/promises";
import { join } from "path";

/**
 * @param {string} inputFilter
 */
export async function clean(inputFilter) {
  const filter = inputFilter
    ? inputFilter.split(",").map((v) => v.trim())
    : undefined;

  const packagesDir = "./packages";
  const pkgFolders = await readdir(packagesDir);

  try {
    await rm("node_modules", { recursive: true });
  } catch (error) {}

  for (const pkgFolder of pkgFolders) {
    if (filter && !filter.includes(pkgFolder)) continue;
    console.info(`- ${pkgFolder}`);
    const pkgPath = join(packagesDir, pkgFolder);

    for (const name of await readdir(pkgPath)) {
      if (
        ["node_modules", "lib", "dist"].includes(name) ||
        name.endsWith(".tsbuildinfo")
      ) {
        try {
          await rm(join(pkgPath, name), { recursive: true });
        } catch (error) {}
      }
    }

    try {
      await rmdir(pkgPath);
    } catch (error) {}
  }
}
