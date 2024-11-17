declare module "dreamkit/definitions" {
  const $api: {
    title(value: string): typeof $api;
    params(value: object): typeof $api;
    self(value: object): typeof $api;
    cache(key?: string): typeof $api;
    create(this: object, params: object): any;
  };
}
