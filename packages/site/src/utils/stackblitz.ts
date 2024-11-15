import sdk from "@stackblitz/sdk";
import type { OpenOptions, Project } from "@stackblitz/sdk";
// @ts-expect-error
import templateFiles from "solid-start-template";

export function buildProjectOptions(
  options: Partial<Project> & {
    pkgDependencies?: Record<string, string>;
    pkgDevDependencies?: Record<string, string>;
  },
) {
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

    files["package.json"] = JSON.stringify(pkg, null, 2);
  }

  return {
    template: "node",
    title: "Dreamkit Example",
    description: "Example",
    ...(options || {}),
    files: files,
  } as Project;
}

export default function openProject(
  project: Parameters<typeof buildProjectOptions>[0] & {
    appFile?: string;
    appCode: string;
  },
  options: OpenOptions = {},
) {
  let appFile = project.appFile ?? "src/dreamkit.tsx";
  if (appFile.startsWith("/")) appFile = appFile.slice(1);
  sdk.openProject(
    buildProjectOptions({
      ...project,
      files: {
        ...project.files,
        [appFile]: project.appCode,
      },
    }),
    {
      openFile: [appFile],
      ...(options || {}),
    },
  );
}