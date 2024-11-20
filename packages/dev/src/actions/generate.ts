import { DreamkitDevServer } from "../DreamkitDevServer.js";
import { generateMeta } from "./generate-meta.js";
import { generateSettings } from "./generate-settings.js";

export async function generate(
  server: DreamkitDevServer,
): Promise<Record<string, { path: string; changed: boolean }>> {
  const [meta, settings] = await Promise.all([
    generateMeta(server),
    generateSettings(server),
  ]);
  return {
    meta,
    ...settings,
  };
}
