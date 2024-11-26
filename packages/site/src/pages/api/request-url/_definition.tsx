declare module "dreamkit/definitions" {
  class RequestUrl extends URL {
    is(...paths: string[]): boolean;
  }
}
