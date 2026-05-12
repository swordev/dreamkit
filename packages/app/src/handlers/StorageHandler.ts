import { createIsKind, kindTag } from "@dreamkit/kind";
import { Constructor } from "@dreamkit/utils/ts.js";

export type StorageHandlerConstructor = Constructor<StorageHandler>;
const tag = "@dreamkit/app/StorageHandler";
export const isStorageHandler = createIsKind<StorageHandlerConstructor>(tag);

export abstract class StorageHandler {
  protected static [kindTag] = tag;
  abstract read(path: string): Promise<ArrayBuffer>;
  abstract stream(path: string): ReadableStream<Uint8Array>;
  abstract move(source: File | string, target: string): Promise<void>;
}
