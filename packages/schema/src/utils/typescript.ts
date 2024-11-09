import type { MinimalArrayType } from "../types/ArrayType.js";
import type { MinimalType } from "../types/MinimalType.js";
import type { MinimalObjectType } from "../types/ObjectType.js";

export type ExactType<
  T extends MinimalType,
  Input,
> = T extends MinimalObjectType
  ? ExactObjectType<T, Input>
  : T extends MinimalArrayType
    ? ExactArrayType<T, Input>
    : Input;

export type ExactArrayType<
  T extends MinimalArrayType,
  Input,
> = Input extends any[] ? ExactType<T["items"], Input[number]>[] : Input;

export type ExactObjectType<
  T extends MinimalObjectType,
  Input,
> = Input extends object
  ? {
      [K in keyof Input]: K extends keyof T["props"]
        ? ExactType<T["props"][K], Input[K]>
        : never;
    }
  : Input;

export {};
