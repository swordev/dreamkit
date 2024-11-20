import { DreamkitDevServer } from "../DreamkitDevServer.js";
import { App, SettingsHandlerSaveResult } from "@dreamkit/app";
import { NodeSettingsHandlerOptions } from "@dreamkit/node-app";

export async function generateSettings(
  server: DreamkitDevServer,
): Promise<SettingsHandlerSaveResult> {
  const $app = new App();
  $app.context.register(NodeSettingsHandlerOptions, {
    value: new NodeSettingsHandlerOptions({
      path: server.options.settingsPath,
    }),
  });
  await $app.add(
    [...server.app.settings, server.app.settingsHandler].filter(Boolean),
  );
  return (await $app["registerAllSettings"]()) || {};
}
