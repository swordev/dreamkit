import { DreamkitDevServer } from "../DreamkitDevServer.js";
import { generateCode } from "./generate-code.js";
import { generateMeta } from "./generate-meta.js";
import { generateSettings } from "./generate-settings.js";

export async function generate(
  server: DreamkitDevServer,
): Promise<Record<string, { path: string; changed: boolean }>> {
  const [meta, settings, code] = await Promise.all([
    generateMeta(server),
    generateSettings(server),
    generateCode(server),
  ]);
  await generateCode(server);
  return {
    meta,
    ...settings,
    ...code,
  };
}
