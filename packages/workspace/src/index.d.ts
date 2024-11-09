import { PackageJson } from "pkg-types";

export type Package = {
  dir: string;
  folder: string;
  manifestPath: string;
  manifest: PackageJson;
};

export type WorkspaceHandlerResult = { files?: Record<string, any> } | void;
export type WorkspaceHandler = (
  manifest: PackageJson,
  data: Omit<Package, "manifest"> & {
    packages: Package[];
  },
) => WorkspaceHandlerResult | Promise<WorkspaceHandlerResult>;

export declare const defineConfig: (handler: WorkspaceHandler) => any;
