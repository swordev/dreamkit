// prettier-ignore
declare module "dreamkit/presets/global.override.js" {
  interface Routing {
    ["/"]: never;
    ["/about"]: never;
    ["/users"]: { id?: number | undefined, name?: string | undefined, country?: { code?: string | undefined } };
  }
}
