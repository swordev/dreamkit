import sdk from "@stackblitz/sdk";
import type { OpenOptions, Project } from "@stackblitz/sdk";
// @ts-expect-error
import templateFiles from "solid-start-template";

export function buildProjectFiles(options: {
  files?: Record<string, any>;
  pkgDependencies?: Record<string, string>;
  pkgDevDependencies?: Record<string, string>;
  appFile?: string;
  appCode: string;
}): Record<string, string> {
  let appFile = options.appFile ?? "src/dreamkit.tsx";
  if (appFile.startsWith("/")) appFile = appFile.slice(1);

  const files = {
    ...templateFiles,
    ...(options.files || {}),
  };

  if (options.pkgDependencies || options.pkgDevDependencies) {
    const pkg = files["package.json"] ? JSON.parse(files["package.json"]) : {};

    pkg.dependencies = {
      ...pkg.dependencies,
      ...options.pkgDependencies,
    };
    pkg.devDependencies = {
      ...pkg.devDependencies,
      ...options.pkgDevDependencies,
    };

    files[appFile] = options.appCode;
    files["package.json"] = JSON.stringify(pkg, null, 2);
  }
  return files;
}
export function buildProjectOptions(
  options: Partial<Project> & {
    pkgDependencies?: Record<string, string>;
    pkgDevDependencies?: Record<string, string>;
    appFile?: string;
    appCode: string;
  },
) {
  return {
    template: "node",
    title: "Dreamkit Example",
    description: "Example",
    ...(options || {}),
    files: buildProjectFiles(options),
  } as Project;
}

export default function openProject(
  project: Parameters<typeof buildProjectOptions>[0],
  options: OpenOptions = {},
) {
  let appFile = project.appFile ?? "src/dreamkit.tsx";
  if (appFile.startsWith("/")) appFile = appFile.slice(1);
  sdk.openProject(buildProjectOptions(project), {
    openFile: [appFile],
    ...(options || {}),
  });
}
