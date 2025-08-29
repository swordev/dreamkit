// @ts-check
export { clean } from "./clean.js";
export { postinstall } from "./postinstall.js";
export { defineConfig } from "./defineConfig.js";
export {
  getTSConfigReferences,
  getRootTSConfigReferences,
} from "./utils/tsconfig.js";
export { defineGitConfig, definePackageJSON, defineTSConfig } from "pkg-types";
