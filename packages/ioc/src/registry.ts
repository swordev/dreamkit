import { MinimalIocClass } from "./class.js";
import { KindMap } from "./utils/kind.js";
import { AbstractConstructor, Constructor } from "./utils/ts.js";

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

export class IocRegistry<Context = any> extends KindMap<
  IocRegistryKey,
  IocRegistryValue<IocRegistryKey, Context>
> {}

export type IocRegistryData = [IocRegistryKey, IocRegistryValue][];
