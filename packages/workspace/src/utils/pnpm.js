import { spawnSync } from "child_process";

/**
 * @returns {string[]}
 */
export function listPNPMPackagePaths() {
  const output = spawnSync(
    "pnpm",
    ["list", "-r", "--depth", "-1", "--parseable"],
    {
      shell: true,
    },
  );

  if (output.error) throw output.error;

  return output.stdout
    .toString()
    .split("\n")
    .filter((v) => !!v.length);
}
