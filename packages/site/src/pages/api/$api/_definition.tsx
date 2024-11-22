declare module "dreamkit/definitions" {
  const $api: {
    title(value: string): typeof $api;
    params(value: object): typeof $api;
    self(value: object): typeof $api;
    cache(key?: string): typeof $api;
    create(cb: (this: object, params: object) => any): {
      title: string;
      params: object;
      (this: object, params: object): any;
    };
  };
}
