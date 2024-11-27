export type DreamkitPluginOptions = {
  entry?: string;
  presets?: string[];
  metaFormat?: "global" | "local";
  metaRouting?: boolean;
  metaGlobalOutput?: string;
  metaLocalExports?: boolean;
  metaLocalOutput?: string;
  settingsPath?: string;
};

export const dreamkitPluginOptions = {
  metaFormat: "global",
  metaRouting: true,
  entry: "./src/dreamkit.tsx",
  presets: ["dreamkit/presets/solid-start.js"],
  metaGlobalOutput: "./src/dreamkit-global.d.ts",
  metaLocalOutput: "./src/dreamkit-local.ts",
  metaLocalExports: true,
  settingsPath: "./settings.json",
} satisfies DreamkitPluginOptions;

export type OutDreamkitPluginOptions = Required<
  Pick<DreamkitPluginOptions, keyof typeof dreamkitPluginOptions>
> &
  Omit<DreamkitPluginOptions, keyof typeof dreamkitPluginOptions>;
