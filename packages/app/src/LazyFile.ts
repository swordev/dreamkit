import { BlobRef } from "./EJSON.js";
import { StorageHandler } from "./handlers/StorageHandler.js";
import { kindApp } from "./utils/kind.js";

export class LazyFile extends File {
  static {
    kindApp(this, "LazyFile");
  }
  constructor(
    readonly ref: BlobRef,
    name: string,
    protected options: FilePropertyBag = {},
    protected handler?: StorageHandler,
  ) {
    super([], name, options);
  }

  override get size(): number {
    return this.ref.size;
  }

  override async text(): Promise<string> {
    const buffer = await this.arrayBuffer();
    return new TextDecoder().decode(buffer);
  }

  override async arrayBuffer(): Promise<ArrayBuffer> {
    return await this.handler!.read(this.ref.path);
  }

  override stream(): ReadableStream<Uint8Array<ArrayBuffer>> {
    return this.handler!.stream(this.ref.path) as any;
  }

  override slice(): Blob {
    throw new Error("LazyFile: slice() is not supported.");
  }

  get [Symbol.toStringTag](): string {
    return "File";
  }
}
