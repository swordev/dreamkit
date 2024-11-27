declare module "dreamkit/definitions" {
  export abstract class SettingsHandler {
    get(constructor: object): unknown | undefined;
    set(constructor: object, data: unknown): Promise<void>;
    protected abstract onLoad(): Promise<Record<string, any>>;
    protected abstract onSave(): Promise<Record<string, any>>;
  }
}
