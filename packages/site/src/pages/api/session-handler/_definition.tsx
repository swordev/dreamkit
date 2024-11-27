declare module "dreamkit/definitions" {
  abstract class SessionHandler {
    get(constructor: object): Promise<unknown | undefined>;
    unset(constructor: object): Promise<void>;
    set(constructor: object, value: unknown | null | undefined): Promise<void>;
    protected abstract onGet(constructor: object): Promise<any>;
    protected abstract onSet(
      constructor: object,
      params: any,
    ): Promise<unknown>;
  }
}
