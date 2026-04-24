import { createKind } from "@dreamkit/kind";
import { Constructor } from "@dreamkit/utils/ts.js";

export type StorageHandlerConstructor = Constructor<StorageHandler>;

export const [kindStorageHandler, isStorageHandler] =
  createKind<StorageHandlerConstructor>("@dreamkit/app/StorageHandler");

export abstract class StorageHandler {
  static {
    kindStorageHandler(this);
  }
  abstract read(path: string): Promise<ArrayBuffer>;
  abstract stream(path: string): ReadableStream<Uint8Array>;
  abstract moveTo(path: string): Promise<void>;
}
