declare const $api: {
  params: (value: object) => typeof $api;
  self: (value: object) => typeof $api;
  create: (this: object, params: object) => any;
};
