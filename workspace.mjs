// @ts-check
import { defineConfig } from "@dreamkit/workspace";
import { readFileSync } from "fs";
import { markdownTable } from "markdown-table";

const readmeTpl = readFileSync("./docs/readme.tpl.md", "utf8");
const readmePackageTpl = readFileSync("./docs/readme-package.tpl.md", "utf8");

export default defineConfig((pkg, { packages, dir }) => {
  if (pkg.name === "@dreamkit/root") {
    const badgeName = (name) => name.replace("@", "").replace("/", "_");
    const dreamkitPkg = packages.find(
      (pkg) => pkg.manifest.name === "dreamkit",
    );
    if (!dreamkitPkg) throw new Error("dreamkit package not found");

    const mainPackages = [dreamkitPkg];
    const internalPackages = packages.filter(
      (pkg) =>
        !pkg.manifest.private &&
        pkg.manifest.name !== "@dreamkit/site" &&
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
          `[${pkg.manifest.name}](${pkg.dir})`,
          `[![npm-badge-${badgeName(pkg.manifest.name)}]](https://www.npmjs.com/package/${pkg.manifest.name})`,
          pkg.manifest.description,
        ]),
      ]);
    const packagesBadges = [...mainPackages, ...internalPackages]
      .map(
        (pkg) =>
          `[npm-badge-${badgeName(pkg.manifest.name)}]: https://img.shields.io/npm/v/${pkg.manifest.name}`,
      )
      .join("\n");
    return {
      files: {
        "README.md": readmeTpl
          .replaceAll("{packagesTable}", renderTable(mainPackages))
          .replaceAll("{internalPackagesTable}", renderTable(internalPackages))
          .replaceAll("{packagesBadges}", packagesBadges),
      },
    };
  }

  if (!pkg.files) throw new Error('"files" field is required');

  if (pkg.name === "@dreamkit/site") return;

  return {
    files: {
      "README.md": readmePackageTpl
        .replaceAll("{packageName}", pkg.name ?? "")
        .replaceAll("{packageDescription}", pkg.description ?? ""),
      "package.json": {
        ...pkg,
        type: pkg.name === "@dreamkit/prettier-config" ? "commonjs" : "module",
        sideEffects: false,
        author: "Juanra GM",
        license: "MIT",
        homepage: "https://dreamkit.dev",
        repository: {
          type: "git",
          url: new URL(`https://github.com/swordev/dreamkit/tree/main/${dir}`)
            .href,
        },
        contributors: [
          {
            name: "Juanra GM",
            email: "juanrgm724@gmail.com",
            url: "https://github.com/juanrgm",
          },
        ],
      },
    },
  };
});
