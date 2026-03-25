// @ts-check
import { createTSConfigFiles, defineConfig } from "@dreamkit/workspace";
import { readFileSync } from "fs";
import { markdownTable } from "markdown-table";

const readmePackageTpl = readFileSync("./docs/readme-package.tpl.md", "utf8");

export default defineConfig(({ pkg, packages }) => {
  if (!pkg.manifest.private && !pkg.manifest.files)
    throw new Error('"files" field is required');
  if (pkg.manifest.private && !pkg.isRoot) return;
  if (pkg.name === "@dreamkit/site") return;
  return {
    files: {
      ...createTSConfigFiles({
        packages: packages.filter(
          (pkg) => !(pkg.manifest.private || pkg.name === "@dreamkit/site"),
        ),
        pkg,
        extends: ["publish"],
      }),
      ...(pkg.isRoot && {
        "README.md": renderRootReadme(packages),
      }),
      ...(!pkg.isRoot && {
        "README.md": readmePackageTpl
          .replaceAll("{packageName}", pkg.name ?? "")
          .replaceAll("{packageDescription}", pkg.manifest.description ?? ""),
        "package.json": {
          ...pkg.manifest,
          type:
            pkg.name === "@dreamkit/prettier-config" ? "commonjs" : "module",
          sideEffects: false,
          author: "Juanra GM",
          license: "MIT",
          homepage: "https://dreamkit.dev",
          repository: {
            type: "git",
            url: new URL(
              `https://github.com/swordev/dreamkit/tree/main/${pkg.dir}`,
            ).href,
          },
          contributors: [
            {
              name: "Juanra GM",
              email: "juanrgm724@gmail.com",
              url: "https://github.com/juanrgm",
            },
          ],
        },
      }),
    },
  };
});

/**
 *
 * @param {import("@dreamkit/workspace").Package[]} packages
 * @returns
 */
export function renderRootReadme(packages) {
  /**
   * @param {string} name
   * @returns {string}
   */
  const badgeName = (name) => name.replace("@", "").replace("/", "_");
  const dreamkitPkg = packages.find((pkg) => pkg.name === "dreamkit");
  if (!dreamkitPkg) throw new Error("dreamkit package not found");

  const mainPackages = [dreamkitPkg];
  const internalPackages = packages.filter(
    (pkg) =>
      !pkg.manifest.private &&
      pkg.name !== "@dreamkit/site" &&
      pkg !== dreamkitPkg,
  );

  /**
   *
   * @param {import("@dreamkit/workspace").Package[]} pkgs
   * @returns
   */
  const renderTable = (pkgs) =>
    markdownTable([
      ["Name", "Version", "Description"],
      ...pkgs.map((pkg, index) => [
        `[${pkg.name}](${pkg.dir})`,
        `[![npm-badge-${badgeName(pkg.name)}]](https://www.npmjs.com/package/${pkg.name})`,
        pkg.manifest.description,
      ]),
    ]);
  const packagesBadges = [...mainPackages, ...internalPackages]
    .map(
      (pkg) =>
        `[npm-badge-${badgeName(pkg.name)}]: https://img.shields.io/npm/v/${pkg.name}`,
    )
    .join("\n");

  return readFileSync("./docs/readme.tpl.md", "utf8")
    .replaceAll("{packagesTable}", renderTable(mainPackages))
    .replaceAll("{internalPackagesTable}", renderTable(internalPackages))
    .replaceAll("{packagesBadges}", packagesBadges);
}
