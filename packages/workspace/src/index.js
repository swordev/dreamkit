// @ts-check
export { clean } from "./actions/clean.js";
export { postinstall } from "./actions/postinstall.js";
export { defineConfig } from "./defineConfig.js";
export {
  getTSConfigReferences,
  getRootTSConfigReferences,
  createTSConfigFiles,
} from "./utils/tsconfig.js";
export { defineGitConfig, definePackageJSON, defineTSConfig } from "pkg-types";
