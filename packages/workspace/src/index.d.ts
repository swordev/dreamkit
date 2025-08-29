import type { PackageJson, TSConfig } from "pkg-types";

export { defineGitConfig, definePackageJSON, defineTSConfig } from "pkg-types";

export type Package = {
  dir: string;
  name: string;
  folder: string;
  manifestPath: string;
  manifest: PackageJson;
  isRoot: boolean;
  isTypeScript: boolean;
  deps: string[];
};

export type WorkspaceHandlerResult = {
  files?: Record<
    string,
    | string
    | false
    | Buffer
    | Record<string, any>
    | any[]
    | ((prev: any) => any)
    | undefined
  >;
} | void;
export type WorkspaceHandler = (data: {
  pkg: Package;
  isRoot: boolean;
  packages: Package[];
}) =>
  | WorkspaceHandlerResult
  | Promise<WorkspaceHandlerResult>
  | undefined
  | Promise<undefined>;

export declare const getTSConfigReferences: (
  pkg: Package,
  options?: {
    fileName?: string;
    exclude?: string[];
  },
) => { path: string }[];
export declare const getRootTSConfigReferences: (
  packages: Package[],
  options?: {
    fileName?: string;
    exclude?: string[];
  },
) => { path: string }[];
export declare const defineConfig: (handler: WorkspaceHandler) => any;
export declare const createTSConfigFiles: (options: {
  packages: Package[];
  pkg: Package;
  extends?: Record<string, boolean> | (string | false)[];
  root?: TSConfig;
  base?: TSConfig;
  build?: TSConfig;
}) => Record<string, any>;
