export type DreamkitPluginOptions = {
  entry?: string;
  metaFormat?: "global" | "local";
  metaRouting?: boolean;
  metaGlobalOutput?: string;
  metaLocalExports?: boolean;
  metaLocalOutput?: string;
};

export const dreamkitPluginOptions = {
  metaFormat: "global",
  metaRouting: true,
  entry: "./src/dreamkit.tsx",
  metaGlobalOutput: "./src/dreamkit-global.d.ts",
  metaLocalOutput: "./src/dreamkit-local.ts",
  metaLocalExports: true,
} satisfies DreamkitPluginOptions;

export type OutDreamkitPluginOptions = Required<
  Pick<DreamkitPluginOptions, keyof typeof dreamkitPluginOptions>
> &
  Omit<DreamkitPluginOptions, keyof typeof dreamkitPluginOptions>;
