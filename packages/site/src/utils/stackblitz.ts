import sdk from "@stackblitz/sdk";
import type { OpenOptions, Project } from "@stackblitz/sdk";
// @ts-expect-error
import files from "solid-start-template";

export function buildProjectOptions(
  options: Partial<Project> & {
    appCode?: string;
  },
) {
  return {
    template: "node",
    title: "Project",
    description: "Example",
    ...(options || {}),
    files: {
      ...files,
      ...(options.files || {}),
      "src/dreamkit.tsx": options.appCode ?? "",
    },
  } as Project;
}

export default function openProject(
  project: Parameters<typeof buildProjectOptions>[0] = {},
  options: OpenOptions = {},
) {
  sdk.openProject(buildProjectOptions(project), {
    openFile: ["src/dreamkit.tsx"],
    ...(options || {}),
  });
}
