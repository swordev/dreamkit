import { MinimalIocClass } from "./class.js";
import { AbstractConstructor, Constructor } from "./utils/ts.js";
import { getKind } from "@dreamkit/kind";

export type IocRegistryKey =
  | Symbol
  | string
  | Constructor
  | AbstractConstructor;

export type IocRegistryValue<
  K extends IocRegistryKey = IocRegistryKey,
  Context = any,
> = {
  value?: unknown;
  singleton?: boolean;
  useClass?: MinimalIocClass;
  useFactory?: (context: Context, key: K, parent: unknown) => unknown;
  is?: (input: unknown) => boolean;
  onlyIf?: IocRegistryKey[] | ((context: Context) => boolean);
};

export class IocRegistry<Context = any> extends Map<
  IocRegistryKey,
  IocRegistryValue<IocRegistryKey, Context>
> {
  protected kindMap = new Map<string, IocRegistryKey>();
  constructor(
    entries?: readonly (readonly [IocRegistryKey, any])[] | null | IocRegistry,
  ) {
    super(entries);
    if (Array.isArray(entries)) {
      for (const [key] of entries) {
        const kind = getKind(key);
        if (kind) this.kindMap.set(kind, key);
      }
    } else if (entries) {
      this.kindMap = new Map((entries as IocRegistry)["kindMap"]);
    }
  }
  get(
    key: IocRegistryKey,
  ): IocRegistryValue<IocRegistryKey, Context> | undefined {
    const kind = getKind(key);
    if (kind !== undefined) {
      const prevKind = this.kindMap.get(kind);
      if (prevKind !== undefined) return super.get(prevKind);
    } else {
      return super.get(key);
    }
  }
  set(
    key: IocRegistryKey,
    value: IocRegistryValue<IocRegistryKey, Context>,
  ): this {
    const kind = getKind(key);
    if (kind !== undefined) {
      const prevKind = this.kindMap.get(kind);
      if (prevKind !== undefined) super.delete(prevKind);
      this.kindMap.set(kind, key);
    }
    return super.set(key, value);
  }
  delete(key: IocRegistryKey): boolean {
    const kind = getKind(key);
    if (kind !== undefined) {
      const prevKind = this.kindMap.get(kind);
      if (prevKind !== undefined) {
        super.delete(prevKind);
        this.kindMap.delete(kind);
      }
    }
    return super.delete(key);
  }
}

export type IocRegistryData = [IocRegistryKey, IocRegistryValue][];
