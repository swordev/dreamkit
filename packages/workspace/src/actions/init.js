// @ts-check
import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { join, relative } from "path/posix";

const template = `// @ts-check
import { createTSConfigFiles, defineConfig } from "@dreamkit/workspace";

export default defineConfig(({ pkg, packages }) => {
  return {
    files: createTSConfigFiles({ pkg, packages }),
  };
});
`;

export async function init() {
  const root = process.cwd();
  const path = join(root, "workspace.mjs");
  const rpath = "./" + relative(root, path);
  if (existsSync(path)) {
    console.info(`Workspace file already exists: ${rpath}`);
  } else {
    await writeFile(path, template);
    console.info(`Workspace file created at: ${rpath}`);
  }
}
