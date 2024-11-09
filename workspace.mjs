// @ts-check
import { defineConfig } from "@dreamkit/workspace";
import { readFileSync } from "fs";
import { markdownTable } from "markdown-table";

const readmeTpl = readFileSync("./docs/readme.tpl.md", "utf8");
const readmePackageTpl = readFileSync("./docs/readme-package.tpl.md", "utf8");

export default defineConfig((pkg, { packages, dir }) => {
  if (pkg.name === "@dreamkit/root") {
    const dreamkitPkg = packages.find(
      (pkg) => pkg.manifest.name === "dreamkit",
    );
    if (!dreamkitPkg) throw new Error("dreamkit package not found");
    const docPackages = [
      dreamkitPkg,
      ...packages.filter(
        (pkg) =>
          !pkg.manifest.private &&
          pkg.manifest.name !== "@dreamkit/site" &&
          pkg !== dreamkitPkg,
      ),
    ];
    const packagesTable = markdownTable([
      ["Name", "Version", "Description"],
      ...docPackages.map((pkg, index) => [
        `[${pkg.manifest.name}](${pkg.dir})`,
        `[![npm-badge-${index}]](https://www.npmjs.com/package/${pkg.manifest.name})`,
        pkg.manifest.description,
      ]),
    ]);
    const packagesBadges = docPackages
      .map(
        (pkg, index) =>
          `[npm-badge-${index}]: https://img.shields.io/npm/v/${pkg.manifest.name}`,
      )
      .join("\n");
    return {
      files: {
        "README.md": readmeTpl
          .replaceAll("{packagesTable}", packagesTable)
          .replaceAll("{packagesBadges}", packagesBadges),
      },
    };
  } else if (pkg.name === "@dreamkit/site") {
    return;
  }
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
