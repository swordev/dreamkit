// prettier-ignore
declare module "dreamkit/presets/global.override.js" {
  interface Routing {
    ["/about"]: never;
    ["/page2"]: never;
    ["/users"]: { id?: number | undefined, name?: string | undefined, country?: { code?: string | undefined } };
    ["/xA"]: { name?: string | undefined };
  }
}
